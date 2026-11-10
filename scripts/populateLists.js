
const pool = require('../backend/db/pool');

async function populateLists() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Prevent other operations from modifying the lists
        // while they are being rebuilt.
        await client.query(
            'LOCK TABLE registrations IN EXCLUSIVE MODE'
        );

        // Find the 26 users.
        const usersResult = await client.query(
            `SELECT id, email
             FROM users
             WHERE LOWER(email) = ANY($1)
             ORDER BY email`,
            [[
                ...Array.from(
                    { length: 26 },
                    (_, index) =>
                        `testuser${String(index + 1).padStart(2, '0')}@example.com`
                )
            ]]
        );

        // Find the two guests.
        const guestsResult = await client.query(
            `SELECT id, email
             FROM guests
             WHERE LOWER(email) = ANY($1)`,
            [[
                'guest1@example.com',
                'guest2@example.com'
            ]]
        );

        if (usersResult.rowCount !== 26) {
            throw new Error(
                `Expected 26 users, found ${usersResult.rowCount}.`
            );
        }

        if (guestsResult.rowCount !== 2) {
            throw new Error(
                `Expected 2 guests, found ${guestsResult.rowCount}.`
            );
        }

        const usersByEmail = new Map(
            usersResult.rows.map(user => [
                user.email.toLowerCase(),
                user.id
            ])
        );

        const guestsByEmail = new Map(
            guestsResult.rows.map(guest => [
                guest.email.toLowerCase(),
                guest.id
            ])
        );

        // Start with empty registration lists.
        await client.query('DELETE FROM registrations');

        // Register users 1–24.
        for (let i = 1; i <= 24; i++) {
            const email =
                `testuser${String(i).padStart(2, '0')}@example.com`;

            await client.query(
                `INSERT INTO registrations (user_id, status, position)
                 VALUES ($1, 'registered', $2)`,
                [usersByEmail.get(email), i - 1]
            );
        }

        // Waitlist users 25–26.
        for (let i = 25; i <= 26; i++) {
            const email =
                `testuser${String(i).padStart(2, '0')}@example.com`;

            await client.query(
                `INSERT INTO registrations (user_id, status, position)
                 VALUES ($1, 'waitlisted', $2)`,
                [usersByEmail.get(email), i - 25]
            );
        }

        // Waitlist guests 1–2.
        for (let i = 1; i <= 2; i++) {
            const email = `guest${i}@example.com`;

            await client.query(
                `INSERT INTO registrations (guest_id, status, position)
                 VALUES ($1, 'waitlisted', $2)`,
                [guestsByEmail.get(email), i + 1]
            );
        }

        await client.query('COMMIT');

        console.log('Successfully populated registration lists.');
        console.log('Registered users: 24');
        console.log('Waitlisted users: 2');
        console.log('Waitlisted guests: 2');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error populating lists:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

populateLists();
