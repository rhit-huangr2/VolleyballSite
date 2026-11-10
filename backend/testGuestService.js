
const GuestService = require('./services/guestService');
const GuestRepository =
    require('./repositories/postgres/postgresGuestRepository');
const UserRepository =
    require('./repositories/postgres/postgresUserRepository');
const pool = require('./db/pool');

async function test() {
    const guestRepository = new GuestRepository();
    const userRepository = new UserRepository();

    const guestService = new GuestService(
        guestRepository,
        userRepository
    );

    let testGuest = null;

    try {
        // 1. Verify existing guest lookup.
        const existingGuest = await guestService.getGuestByEmail(
            'joshua.choc@example.com'
        );

        if (!existingGuest) {
            throw new Error('Expected guest was not found');
        }

        console.log('Existing guest lookup: PASS');

        // 2. Find the member who registered the existing guest.
        const host = await userRepository.findById(
            existingGuest.guestOfUserId
        );

        if (!host) {
            throw new Error('Registering member was not found');
        }

        // 3. Create a temporary guest using an experience-level label.
        const testEmail = `guest-test-${Date.now()}@example.com`;

        testGuest = await guestService.createGuest({
            name: 'Temporary Test Guest',
            email: testEmail,
            registeredByEmail: host.email,
            experienceLevel: 'Intermediate'
        });

        if (testGuest.rating !== 4) {
            throw new Error(
                `Expected rating 4, got ${testGuest.rating}`
            );
        }

        console.log('Experience-to-rating conversion: PASS');

        // 4. Verify the rating was saved in PostgreSQL.
        const savedGuest = await guestService.getGuestById(
            testGuest.id
        );

        if (savedGuest.rating !== 4) {
            throw new Error(
                `Expected saved rating 4, got ${savedGuest.rating}`
            );
        }

        console.log('PostgreSQL rating persistence: PASS');

        // 5. Verify duplicate guest emails are rejected.
        let duplicateRejected = false;

        try {
            await guestService.createGuest({
                name: 'Duplicate Test Guest',
                email: testGuest.email,
                registeredByEmail: host.email,
                experienceLevel: 'Beginner'
            });
        } catch (error) {
            duplicateRejected =
                error.message === 'This email is already in use';
        }

        if (!duplicateRejected) {
            throw new Error(
                'Duplicate guest email was not rejected'
            );
        }

        console.log('Duplicate guest email rejection: PASS');

        // 6. Verify an email belonging to a member is rejected.
        let memberEmailRejected = false;

        try {
            await guestService.createGuest({
                name: 'Member Email Test Guest',
                email: host.email,
                registeredByEmail: host.email,
                experienceLevel: 'Beginner'
            });
        } catch (error) {
            memberEmailRejected =
                error.message === 'This email is already in use';
        }

        if (!memberEmailRejected) {
            throw new Error(
                'Email belonging to a member was not rejected'
            );
        }

        console.log('Member email rejection: PASS');

        // 7. Verify invalid experience levels are rejected.
        let invalidLevelRejected = false;

        try {
            await guestService.createGuest({
                name: 'Invalid Test Guest',
                email: `invalid-test-${Date.now()}@example.com`,
                registeredByEmail: host.email,
                experienceLevel: 'Unknown'
            });
        } catch (error) {
            invalidLevelRejected =
                error.message === 'Invalid experience level';
        }

        if (!invalidLevelRejected) {
            throw new Error(
                'Invalid experience level was not rejected'
            );
        }

        console.log('Invalid experience-level rejection: PASS');

        // 8. Verify admin rating updates.
        await guestService.updateGuest(testGuest.id, {
            rating: 6
        });

        const updatedGuest = await guestService.getGuestById(
            testGuest.id
        );

        if (updatedGuest.rating !== 6) {
            throw new Error('Guest rating update failed');
        }

        console.log('Guest rating update: PASS');

        // 9. Verify invalid ratings are rejected.
        for (const rating of [-2, 11, 5.5, '6']) {
            let rejected = false;

            try {
                await guestService.updateGuest(testGuest.id, {
                    rating
                });
            } catch (error) {
                rejected = error.message.includes(
                    'Rating must be an integer'
                );
            }

            if (!rejected) {
                throw new Error(
                    `Invalid rating ${rating} was not rejected`
                );
            }
        }

        console.log('Invalid rating rejection: PASS');
        console.log('Guest service tests: ALL PASSED');
    } finally {
        // Delete only the temporary guest created by this test.
        if (testGuest) {
            await guestRepository.delete(testGuest.id);
        }

        await pool.end();
    }
}

test().catch(error => {
    console.error('Guest service test failed:', error);
    process.exitCode = 1;
});
