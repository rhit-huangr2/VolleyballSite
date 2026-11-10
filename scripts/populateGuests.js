
const pool = require('../backend/db/pool');
const {
    getExperienceLevelValue
} = require('../backend/utils/experienceLevels');

const sampleGuests = [
    {
        name: 'Guest One',
        email: 'guest1@example.com',
        registeredByEmail: 'testuser02@example.com',
        experienceLevel: 'Beginner'
    },
    {
        name: 'Guest Two',
        email: 'guest2@example.com',
        registeredByEmail: 'testuser03@example.com',
        experienceLevel: 'Advanced'
    },
    {
        name: 'Guest Three',
        email: 'guest3@example.com',
        registeredByEmail: 'testuser04@example.com',
        experienceLevel: 'Professional'
    }
];

async function populateGuests() {
    try {
        for (const guest of sampleGuests) {
            const userResult = await pool.query(
                `SELECT id FROM users
                 WHERE LOWER(email) = LOWER($1)`,
                [guest.registeredByEmail]
            );

            if (userResult.rowCount === 0) {
                throw new Error(
                    `Registering user not found: ${guest.registeredByEmail}`
                );
            }

            const rating = getExperienceLevelValue(
                guest.experienceLevel
            );

            if (rating === null) {
                throw new Error(
                    `Invalid experience level: ${guest.experienceLevel}`
                );
            }

            await pool.query(
                `INSERT INTO guests (
                    name,
                    email,
                    registered_by_user_id,
                    rating
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING`,
                [
                    guest.name,
                    guest.email,
                    userResult.rows[0].id,
                    rating
                ]
            );

            console.log(
                `Processed ${guest.email} (${guest.experienceLevel}: ${rating})`
            );
        }

        console.log('Guest population complete.');
    } catch (error) {
        console.error('Error populating guests:', error);
    } finally {
        await pool.end();
    }
}

populateGuests();
