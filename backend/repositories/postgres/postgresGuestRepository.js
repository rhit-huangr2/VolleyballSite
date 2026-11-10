
const GuestRepository = require('../interfaces/guestRepository');
const pool = require('../../db/pool');

class PostgresGuestRepository extends GuestRepository {
    mapGuest(row) {
        if (!row) return null;

        return {
            id: row.id,
            name: row.name,
            email: row.email,
            guestOfUserId: row.registered_by_user_id,
            rating: row.rating        };
    }

    async findAll() {
        const result = await pool.query(
            'SELECT * FROM guests ORDER BY id'
        );

        return result.rows.map(row => this.mapGuest(row));
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM guests WHERE id = $1',
            [id]
        );

        return this.mapGuest(result.rows[0]);
    }

    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM guests WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );

        return this.mapGuest(result.rows[0]);
    }

    async create(guest) {
        const result = await pool.query(
            `INSERT INTO guests
                (name, email, registered_by_user_id, rating)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                guest.name,
                guest.email.trim(),
                guest.guestOfUserId,
                guest.rating ?? null
            ]
        );

        return this.mapGuest(result.rows[0]);
    }

    async update(id, changes) {
        const columns = {
            name: 'name',
            email: 'email',
            guestOfUserId: 'registered_by_user_id',
            rating: 'rating'
        };

        const entries = Object.entries(changes)
            .filter(([key]) => Object.hasOwn(columns, key));

        if (entries.length === 0) {
            return this.findById(id);
        }

        const assignments = entries.map(
            ([key], index) => `${columns[key]} = $${index + 1}`
        );

        const values = entries.map(([, value]) => value);

        const result = await pool.query(
            `UPDATE guests
             SET ${assignments.join(', ')}
             WHERE id = $${values.length + 1}
             RETURNING *`,
            [...values, id]
        );

        return this.mapGuest(result.rows[0]);
    }

    async delete(id) {
        // A guest with a registration cannot be deleted until that
        // registration has been removed.
        const result = await pool.query(
            'DELETE FROM guests WHERE id = $1 RETURNING id',
            [id]
        );

        return result.rowCount > 0;
    }
}

module.exports = PostgresGuestRepository;
