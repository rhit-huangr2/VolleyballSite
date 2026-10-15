
const EmailMetadataRepository = require('../interfaces/emailMetadataRepository');
const pool = require('../../db/pool');

class PostgresEmailMetadataRepository extends EmailMetadataRepository {
    async get(key) {
        const result = await pool.query(
            'SELECT value FROM email_metadata WHERE key = $1',
            [key]
        );

        return result.rows.length > 0
            ? result.rows[0].value
            : undefined;
    }

    async set(key, value) {
        await pool.query(
            `INSERT INTO email_metadata (key, value)
             VALUES ($1, $2::jsonb)
             ON CONFLICT (key)
             DO UPDATE SET value = EXCLUDED.value`,
            [key, JSON.stringify(value)]
        );

        return value;
    }

    async getAll() {
        const result = await pool.query(
            'SELECT key, value FROM email_metadata ORDER BY key'
        );

        return Object.fromEntries(
            result.rows.map(row => [row.key, row.value])
        );
    }
}

module.exports = PostgresEmailMetadataRepository;
