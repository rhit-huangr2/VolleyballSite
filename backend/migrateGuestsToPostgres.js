
require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const pool = require('./db/pool');

const guestsFilePath = path.join(__dirname, 'data', 'guests.json');

async function migrateGuests() {
    const contents = await fs.readFile(guestsFilePath, 'utf8');
    const data = JSON.parse(contents);
    const guests = Array.isArray(data.guests) ? data.guests : [];

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const guest of guests) {
            if (!guest.name || !guest.email || !guest.guestOf) {
                throw new Error(
                    'Each guest must have a name, email, and guestOf value.'
                );
            }

            // Find the member by name, ignoring capitalization and whitespace.
            const memberResult = await client.query(
                `SELECT id
                 FROM users
                 WHERE is_guest = FALSE
                   AND LOWER(TRIM(name)) = LOWER(TRIM($1))
                 ORDER BY id`,
                [guest.guestOf]
            );

            if (memberResult.rowCount !== 1) {
                throw new Error(
                    `Could not uniquely identify the registering member for guest ${guest.email}.`
                );
            }

            const memberId = memberResult.rows[0].id;

            // Reuse an existing guest with the same email.
            const existingResult = await client.query(
                `SELECT id
                 FROM guests
                 WHERE LOWER(email) = LOWER($1)`,
                [guest.email.trim()]
            );

            let guestId;

            if (existingResult.rowCount > 0) {
                guestId = existingResult.rows[0].id;

                await client.query(
                    `UPDATE guests
                     SET name = $1,
                         registered_by_user_id = $2,
                         experience_level = $3
                     WHERE id = $4`,
                    [
                        guest.name,
                        memberId,
                        guest.experienceLevel ?? null,
                        guestId
                    ]
                );
            } else {
                const insertResult = await client.query(
                    `INSERT INTO guests (
                        name, email, registered_by_user_id, experience_level
                    )
                    VALUES ($1, $2, $3, $4)
                    RETURNING id`,
                    [
                        guest.name,
                        guest.email.trim(),
                        memberId,
                        guest.experienceLevel ?? null
                    ]
                );

                guestId = insertResult.rows[0].id;
            }

            console.log(`Imported guest record: ${guest.name}`);
        }

        await client.query('COMMIT');
        console.log(`Guest import complete. Records processed: ${guests.length}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

migrateGuests()
    .catch(error => {
        console.error('Guest import failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
