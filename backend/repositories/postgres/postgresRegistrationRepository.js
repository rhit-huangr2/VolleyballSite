
const RegistrationRepository = require('../interfaces/registrationRepository');
const pool = require('../../db/pool');

class PostgresRegistrationRepository extends RegistrationRepository {
    async findByStatus(status) {
        if (!['registered', 'waitlisted'].includes(status)) {
            throw new Error('Invalid registration status');
        }

        const result = await pool.query(
            `SELECT u.*, r.status, r.position
             FROM registrations r
             JOIN users u ON u.id = r.user_id
             WHERE r.status = $1
             ORDER BY r.position ASC`,
            [status]
        );

        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            rating: row.rating,
            role: row.role,
            emailOptIn: row.email_opt_in,
            isGuest: row.is_guest,
            guestOf: row.guest_of_email,
            experienceLevel: row.experience_level,
            status: row.status,
            position: row.position
        }));
    }

    async findRegistered() {
        return this.findByStatus('registered');
    }

    async findWaitlisted() {
        return this.findByStatus('waitlisted');
    }

    async moveUser(userId, status) {
        if (!['registered', 'waitlisted'].includes(status)) {
            throw new Error('Invalid registration status');
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Serialize registration changes so concurrent requests
            // don't allocate the same list position.
            await client.query(
                'LOCK TABLE registrations IN EXCLUSIVE MODE'
            );

            const existing = await client.query(
                'SELECT id FROM registrations WHERE user_id = $1',
                [userId]
            );

            const nextPosition = await client.query(
                `SELECT COALESCE(MAX(position), -1) + 1 AS position
                 FROM registrations
                 WHERE status = $1`,
                [status]
            );

            const position = nextPosition.rows[0].position;

            if (existing.rowCount > 0) {
                await client.query(
                    `UPDATE registrations
                     SET status = $1, position = $2
                     WHERE user_id = $3`,
                    [status, position, userId]
                );
            } else {
                await client.query(
                    `INSERT INTO registrations (user_id, status, position)
                     VALUES ($1, $2, $3)`,
                    [userId, status, position]
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

    async addToRegistered(userId) {
        return this.moveUser(userId, 'registered');
    }

    async addToWaitlist(userId) {
        return this.moveUser(userId, 'waitlisted');
    }

    async remove(userId) {
        const result = await pool.query(
            'DELETE FROM registrations WHERE user_id = $1',
            [userId]
        );

        return result.rowCount > 0;
    }

    async clearAll() {
        const result = await pool.query(
            'DELETE FROM registrations'
        );

        return result.rowCount;
    }

    async registerUser(userId, maxRegistered) {
        if (!Number.isInteger(maxRegistered) || maxRegistered < 1) {
            throw new Error('Invalid registration capacity');
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Serialize placement decisions across concurrent requests.
            await client.query(
                'LOCK TABLE registrations IN EXCLUSIVE MODE'
            );

            // Do not create a duplicate registration.
            const existing = await client.query(
                `SELECT status, position
             FROM registrations
             WHERE user_id = $1`,
                [userId]
            );

            if (existing.rowCount > 0) {
                await client.query('COMMIT');
                return existing.rows[0];
            }

            const countResult = await client.query(
                `SELECT COUNT(*) AS count
             FROM registrations
             WHERE status = 'registered'`
            );

            const registeredCount = Number(countResult.rows[0].count);

            const status = registeredCount < maxRegistered
                ? 'registered'
                : 'waitlisted';

            const positionResult = await client.query(
                `SELECT COALESCE(MAX(position), -1) + 1 AS position
             FROM registrations
             WHERE status = $1`,
                [status]
            );

            const position = Number(positionResult.rows[0].position);

            const result = await client.query(
                `INSERT INTO registrations (user_id, status, position)
             VALUES ($1, $2, $3)
             RETURNING status, position`,
                [userId, status, position]
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

}

module.exports = PostgresRegistrationRepository;
