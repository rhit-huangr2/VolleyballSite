
const UserRepository = require('../interfaces/userRepository');
const pool = require('../../db/pool');

class PostgresUserRepository extends UserRepository {
    // Convert database column names to the camelCase fields
    // expected by JavaScript code.
    mapUser(row) {
        if (!row) return null;

        return {
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            rating: row.rating,
            role: row.role,
            emailOptIn: row.email_opt_in,
            isGuest: row.is_guest,
            guestOf: row.guest_of_email,
            experienceLevel: row.experience_level
        };
    }

    async findAll() {
        const result = await pool.query(
            'SELECT * FROM users ORDER BY id'
        );

        return result.rows.map(row => this.mapUser(row));
    }

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        return this.mapUser(result.rows[0]);
    }

    async findByEmail(email) {
        const result = await pool.query(
            `SELECT *
             FROM users
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1`,
            [email.trim()]
        );

        return this.mapUser(result.rows[0]);
    }

    async create(user) {
        const result = await pool.query(
            `INSERT INTO users (
                name, email, password_hash, rating, role,
                email_opt_in, is_guest, guest_of_email,
                experience_level
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                user.name,
                user.email,
                user.passwordHash ?? null,
                user.rating ?? null,
                user.role ?? (user.isGuest ? null : 'member'),
                user.emailOptIn ?? null,
                user.isGuest ?? false,
                user.guestOf ?? null,
                user.experienceLevel ?? null
            ]
        );

        return this.mapUser(result.rows[0]);
    }

    async update(id, changes) {
        const columns = {
            name: 'name',
            email: 'email',
            passwordHash: 'password_hash',
            rating: 'rating',
            role: 'role',
            emailOptIn: 'email_opt_in',
            isGuest: 'is_guest',
            guestOf: 'guest_of_email',
            experienceLevel: 'experience_level'
        };

        const entries = Object.entries(changes).filter(
            ([key]) => Object.hasOwn(columns, key)
        );

        if (entries.length === 0) {
            return this.findById(id);
        }

        const assignments = entries.map(
            ([key], index) => `${columns[key]} = $${index + 1}`
        );

        const values = entries.map(([, value]) => value);

        const result = await pool.query(
            `UPDATE users
             SET ${assignments.join(', ')}
             WHERE id = $${values.length + 1}
             RETURNING *`,
            [...values, id]
        );

        return this.mapUser(result.rows[0]);
    }

    async delete(id) {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );

        return result.rowCount > 0;
    }
}

module.exports = PostgresUserRepository;
