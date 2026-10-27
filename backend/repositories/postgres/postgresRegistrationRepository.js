
const RegistrationRepository = require('../interfaces/registrationRepository');
const pool = require('../../db/pool');

class PostgresRegistrationRepository extends RegistrationRepository {
    async findByStatus(status) {
        if (!['registered', 'waitlisted'].includes(status)) {
            throw new Error('Invalid registration status');
        }

        const result = await pool.query(
            `SELECT
                r.id AS registration_id,
                r.status,
                r.position,
    
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email,
                u.rating,
                u.role,
                u.email_opt_in,
    
                g.id AS guest_id,
                g.name AS guest_name,
                g.email AS guest_email,
                g.rating AS guest_rating,
                host.name AS guest_of
    
             FROM registrations r
    
             LEFT JOIN users u
                ON u.id = r.user_id
    
             LEFT JOIN guests g
                ON g.id = r.guest_id
    
             LEFT JOIN users host
                ON host.id = g.registered_by_user_id
    
             WHERE r.status = $1
             ORDER BY r.position ASC`,
            [status]
        );

        return result.rows.map(row => {
            // This registration belongs to a guest.
            if (row.guest_id !== null) {
                return {
                    id: row.guest_id,
                    name: row.guest_name,
                    email: row.guest_email,
                    isGuest: true,
                    guestOf: row.guest_of,
                    rating: row.guest_rating,
                    status: row.status,
                    position: row.position
                };
            }

            // This registration belongs to a member.
            return {
                id: row.user_id,
                name: row.user_name,
                email: row.user_email,
                rating: row.rating,
                role: row.role,
                emailOptIn: row.email_opt_in,
                isGuest: false,
                status: row.status,
                position: row.position
            };
        });
    }

    async findRegistered() {
        return this.findByStatus('registered');
    }

    async findWaitlisted() {
        return this.findByStatus('waitlisted');
    }

    async movePerson(personId, personType, status) {
        if (!['registered', 'waitlisted'].includes(status)) {
            throw new Error('Invalid registration status');
        }

        if (!['user', 'guest'].includes(personType)) {
            throw new Error('Invalid person type');
        }

        const client = await pool.connect();

        const idColumn = personType === 'user' ? 'user_id' : 'guest_id';

        try {
            await client.query('BEGIN');

            // Serialize list changes to prevent duplicate positions.
            await client.query(
                'LOCK TABLE registrations IN EXCLUSIVE MODE'
            );

            const existing = await client.query(
                `SELECT id
                 FROM registrations
                 WHERE ${idColumn} = $1`,
                [personId]
            );

            const nextPosition = await client.query(
                `SELECT COALESCE(MAX(position), -1) + 1 AS position
                 FROM registrations
                 WHERE status = $1`,
                [status]
            );

            const position = Number(nextPosition.rows[0].position);

            if (existing.rowCount > 0) {
                await client.query(
                    `UPDATE registrations
                     SET status = $1, position = $2
                     WHERE ${idColumn} = $3`,
                    [status, position, personId]
                );
            } else {
                await client.query(
                    `INSERT INTO registrations (${idColumn}, status, position)
                     VALUES ($1, $2, $3)`,
                    [personId, status, position]
                );
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async addToRegistered(personId, personType = 'user') {
        return this.movePerson(personId, personType, 'registered');
    }

    async addToWaitlist(personId, personType = 'user') {
        return this.movePerson(personId, personType, 'waitlisted');
    }

    async remove(personId, personType = 'user') {
        if (!['user', 'guest'].includes(personType)) {
            throw new Error('Invalid person type');
        }

        const idColumn = personType === 'user' ? 'user_id' : 'guest_id';

        const result = await pool.query(
            `DELETE FROM registrations
            WHERE ${ idColumn } = $1`,
            [personId]
        );

        return result.rowCount > 0;
    }

    async replaceAllLists(registeredPeople, waitlistedPeople) {
        if (
            !Array.isArray(registeredPeople) ||
            !Array.isArray(waitlistedPeople)
        ) {
            throw new Error('Both player lists must be arrays.');
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(
                'LOCK TABLE registrations IN EXCLUSIVE MODE'
            );

            // Defer the unique-position constraint while rebuilding the lists.
            await client.query(
                'SET CONSTRAINTS unique_registration_position DEFERRED'
            );

            await client.query('DELETE FROM registrations');

            const insertPeople = async (people, status) => {
                for (let position = 0; position < people.length; position++) {
                    const person = people[position];

                    const personType = person.isGuest ? 'guest' : 'user';
                    const idColumn =
                        personType === 'guest' ? 'guest_id' : 'user_id';

                    const personId = Number(person.id);

                    if (!Number.isSafeInteger(personId) || personId <= 0) {
                        throw new Error('Invalid player ID.');
                    }

                    await client.query(
                        `INSERT INTO registrations
                            (${idColumn}, status, position)
                         VALUES ($1, $2, $3)`,
                        [personId, status, position]
                    );
                }
            };

            await insertPeople(registeredPeople, 'registered');
            await insertPeople(waitlistedPeople, 'waitlisted');

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }    

    async clearAll() {
        const result = await pool.query(
            'DELETE FROM registrations'
        );

        return result.rowCount;
    }

    async registerPerson(personId, personType, maxRegistered) {
        if (!['user', 'guest'].includes(personType)) {
            throw new Error('Invalid person type');
        }

        if (!Number.isInteger(maxRegistered) || maxRegistered < 1) {
            throw new Error('Invalid registration capacity');
        }

        const client = await pool.connect();

        const idColumn = personType === 'user' ? 'user_id' : 'guest_id';

        try {
            await client.query('BEGIN');

            // Serialize registration decisions across concurrent requests.
            await client.query(
                'LOCK TABLE registrations IN EXCLUSIVE MODE'
            );

            // Don't register the same person twice.
            const existing = await client.query(
                `SELECT status, position
                 FROM registrations
                 WHERE ${idColumn} = $1`,
                [personId]
            );

            if (existing.rowCount > 0) {
                await client.query('COMMIT');
                return existing.rows[0];
            }

            // Count all registered players, including guests.
            const countResult = await client.query(
                `SELECT COUNT(*) AS count
                 FROM registrations
                 WHERE status = 'registered'`
            );

            const registeredCount = Number(countResult.rows[0].count);

            const status = registeredCount < maxRegistered
                ? 'registered'
                : 'waitlisted';

            // Append the person to the end of the chosen list.
            const positionResult = await client.query(
                `SELECT COALESCE(MAX(position), -1) + 1 AS position
                 FROM registrations
                 WHERE status = $1`,
                [status]
            );

            const position = Number(positionResult.rows[0].position);

            const result = await client.query(
                `INSERT INTO registrations (${idColumn}, status, position)
                 VALUES ($1, $2, $3)
                 RETURNING status, position`,
                [personId, status, position]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async registerUser(userId, maxRegistered) {
        return this.registerPerson(userId, 'user', maxRegistered);
    }

    async registerGuest(guestId, maxRegistered) {
        return this.registerPerson(guestId, 'guest', maxRegistered);
    }

}

module.exports = PostgresRegistrationRepository;
