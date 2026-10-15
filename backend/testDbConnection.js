
const pool = require('./db/pool');

async function testConnection() {
    try {
        const result = await pool.query(
            'SELECT current_database() AS database, NOW() AS time'
        );

        console.log('Connected to PostgreSQL:', result.rows[0]);
    } catch (error) {
        console.error('Database connection failed:', error.message);
    } finally {
        await pool.end();
    }
}

testConnection();
