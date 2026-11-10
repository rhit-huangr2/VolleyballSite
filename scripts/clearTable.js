
const pool = require('../backend/db/pool');

async function clearTable() {
    const table = process.argv[2]?.toLowerCase();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        switch (table) {
            case 'registrations':
                await client.query('DELETE FROM registrations');
                break;

            case 'guests':
                await client.query(
                    'DELETE FROM registrations WHERE guest_id IS NOT NULL'
                );
                await client.query('DELETE FROM guests');
                break;

            case 'users':
            case 'all':
                // Remove dependent records first.
                await client.query('DELETE FROM registrations');
                await client.query('DELETE FROM guests');
                await client.query('DELETE FROM users');
                break;

            default:
                throw new Error(
                    'Invalid table. Use: registrations, guests, users, or all.'
                );
        }

        await client.query('COMMIT');

        console.log(`Successfully cleared: ${table}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error clearing data:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

clearTable();
