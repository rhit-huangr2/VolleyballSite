
const RegistrationService = require('./services/registrationService');

const UserRepository =
    require('./repositories/postgres/postgresUserRepository');

const GuestRepository =
    require('./repositories/postgres/postgresGuestRepository');

const RegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');

const pool = require('./db/pool');

async function test() {
    const userRepository = new UserRepository();
    const guestRepository = new GuestRepository();
    const registrationRepository = new RegistrationRepository();

    const service = new RegistrationService(
        registrationRepository,
        userRepository,
        guestRepository
    );

    let testGuest = null;
    let testRegistrationCreated = false;

    try {
        const registeredBefore = await service.getRegisteredUsers();
        const waitlistedBefore = await service.getWaitlistedUsers();

        console.log('Registered players:', registeredBefore.length);
        console.log('Waitlisted players:', waitlistedBefore.length);

        const host = await userRepository.findAll().then(users =>
            users.find(user => user.role !== 'admin')
        );

        if (!host) {
            throw new Error('No member available for test');
        }

        // Create a temporary guest without registering them yet.
        testGuest = await guestRepository.create({
            name: 'Registration Test Guest',
            email: `registration-test-${Date.now()}@example.com`,
            guestOfUserId: host.id,
            rating: 4
        });

        // Test normal registration based on current capacity.
        const result = await service.registerGuest(testGuest.id);
        testRegistrationCreated = true;

        const registeredAfter = await service.getRegisteredUsers();
        const waitlistedAfter = await service.getWaitlistedUsers();

        if (registeredBefore.length < 24) {
            if (result.status !== 'registered') {
                throw new Error('Guest should have been registered');
            }

            if (registeredAfter.length !== registeredBefore.length + 1) {
                throw new Error('Registered count did not increase');
            }

            console.log('Guest registration below capacity: PASS');
        } else {
            if (result.status !== 'waitlisted') {
                throw new Error('Guest should have been waitlisted');
            }

            if (waitlistedAfter.length !== waitlistedBefore.length + 1) {
                throw new Error('Waitlist count did not increase');
            }

            console.log('Guest registration at capacity: PASS');
        }

        // Admin moves the guest to the registered list, even above capacity.
        await registrationRepository.movePerson(
            testGuest.id,
            'guest',
            'registered'
        );

        const afterAdminMove = await service.getRegisteredUsers();

        if (!afterAdminMove.some(person =>
            person.isGuest && person.id === testGuest.id
        )) {
            throw new Error('Admin move to registered list failed');
        }

        console.log('Admin capacity override: PASS');

        // Verify invalid IDs are rejected.
        for (const [label, operation, expectedMessage] of [
            [
                'guest',
                () => service.registerGuest(-1),
                'Guest not found'
            ],
            [
                'member',
                () => service.registerUser(-1),
                'User not found'
            ]
        ]) {
            try {
                await operation();
                throw new Error(`Expected nonexistent ${label} to be rejected`);
            } catch (error) {
                if (error.message !== expectedMessage) {
                    throw error;
                }
            }

            console.log(`Invalid ${label} rejected: PASS`);
        }

        console.log('Registration service tests: ALL PASSED');
    } finally {
        // Remove only the temporary guest's registration and guest record.
        if (testGuest) {
            if (testRegistrationCreated) {
                await registrationRepository.remove(
                    testGuest.id,
                    'guest'
                );
            }

            await guestRepository.delete(testGuest.id);
        }

        await pool.end();
    }
}

test().catch(error => {
    console.error('Registration service test failed:', error);
    process.exitCode = 1;
});
