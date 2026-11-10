
const GuestRepository = require('./repositories/postgres/postgresGuestRepository');
const pool = require('./db/pool');

async function test() {
    const guests = new GuestRepository();

    try {
        const allGuests = await guests.findAll();

        console.log('Guests found:', allGuests.length);
        console.log(
            'Guest data:',
            allGuests.map(({ id, name, email, guestOfUserId, experienceLevel }) => ({
                id,
                name,
                email,
                guestOfUserId,
                experienceLevel
            }))
        );
    } finally {
        await pool.end();
    }
}

test().catch(error => {
    console.error('Guest repository test failed:', error.message);
    process.exitCode = 1;
});
