
const UserRepository =
    require('./repositories/postgres/postgresUserRepository');
const pool = require('./db/pool');

async function test() {
    const userRepository = new UserRepository();

    try {
        // Find an existing user by email.
        const user = await userRepository.findByEmail(
            'joshua.choc@example.com'
        );

        // This email belongs to a guest, not necessarily a user account.
        // Instead, find a known member from the existing registrations.
        const registrations = await pool.query(
            `SELECT u.email
             FROM registrations r
             JOIN users u ON u.id = r.user_id
             WHERE r.status = 'registered'
             LIMIT 1`
        );

        if (registrations.rows.length === 0) {
            throw new Error('No registered member found for testing');
        }

        const email = registrations.rows[0].email;
        const member = await userRepository.findByEmail(email);

        if (!member) {
            throw new Error('Member lookup by email failed');
        }

        console.log('Member found:', member.name);
        console.log('Email lookup: PASS');

        // Verify email lookup is case-insensitive.
        const caseInsensitiveMember =
            await userRepository.findByEmail(email.toUpperCase());

        if (!caseInsensitiveMember || caseInsensitiveMember.id !== member.id) {
            throw new Error('Case-insensitive lookup failed');
        }

        console.log('Case-insensitive lookup: PASS');

        // Verify nonexistent emails return null.
        const missing = await userRepository.findByEmail(
            'missing-user-12345@example.com'
        );

        if (missing !== null) {
            throw new Error('Nonexistent email should return null');
        }

        console.log('Missing email lookup: PASS');
        console.log('User repository tests: ALL PASSED');
    } finally {
        await pool.end();
    }
}

test().catch(error => {
    console.error('User repository test failed:', error);
    process.exitCode = 1;
});
