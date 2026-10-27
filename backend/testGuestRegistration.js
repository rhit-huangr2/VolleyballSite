
const RegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');
const GuestRepository =
    require('./repositories/postgres/postgresGuestRepository');
const pool = require('./db/pool');

async function test() {
    const registrations = new RegistrationRepository();
    const guests = new GuestRepository();

    let guest = null;

    try {
        // Find the existing guest without changing guest data.
        guest = await guests.findByEmail('joshua.choc@example.com');

        if (!guest) {
            throw new Error('Test guest was not found');
        }

        const before = await registrations.findRegistered();

        console.log('Registered before test:', before.length);

        // With 24 registered players, the guest should be waitlisted.
        const result = await registrations.registerGuest(guest.id, 24);

        console.log('New guest registration:', result);

        if (before.length >= 24 && result.status !== 'waitlisted') {
            throw new Error('Guest should have been waitlisted');
        }

        // Simulate an admin manually moving the guest to the registered list.
        await registrations.movePerson(
            guest.id,
            'guest',
            'registered'
        );

        const afterMove = await registrations.findRegistered();

        console.log('Registered after admin move:', afterMove.length);

        if (afterMove.length !== before.length + 1) {
            throw new Error('Admin move did not add the guest to the registered list');
        }

        console.log('Admin override of capacity: PASS');
        console.log('Automatic promotion/demotion: not triggered by this move');
    } finally {
        // Remove only this guest's registration, even if a check fails.
        if (guest) {
            await registrations.remove(guest.id, 'guest');
        }

        await pool.end();
    }
}

test().catch(error => {
    console.error('Guest registration test failed:', error.message);
    process.exitCode = 1;
});
