
const pool = require('../backend/db/pool');
const { hashPassword } = require('../backend/utils/passwordUtils');

const sampleUsers = Array.from({ length: 30 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');

    return {
        name: `Test User ${number}`,
        email: `testuser${number}@example.com`,
        password: 'test',
        rating: (index % 10) + 1,
        role: index === 0 ? 'admin' : 'member',
        emailOptIn: true
    };
});

async function populateUsers() {
    try {
        for (const user of sampleUsers) {
            const passwordHash = await hashPassword(user.password);

            await pool.query(
                `INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    rating,
                    role,
                    email_opt_in
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (LOWER(email))
                DO UPDATE SET
                    name = EXCLUDED.name,
                    password_hash = EXCLUDED.password_hash,
                    rating = EXCLUDED.rating,
                    role = EXCLUDED.role,
                    email_opt_in = EXCLUDED.email_opt_in`,
                [
                    user.name,
                    user.email,
                    passwordHash,
                    user.rating,
                    user.role,
                    user.emailOptIn
                ]
            );

            // console.log(`Processed: ${user.email}`);
        }

        console.log('Successfully populated 30 users.');
    } catch (error) {
        console.error('Error populating users:', error);
    } finally {
        await pool.end();
    }
}

populateUsers();
