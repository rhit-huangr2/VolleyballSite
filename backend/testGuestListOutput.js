
const pool = require('./db/pool');

const UserRepository =
    require('./repositories/postgres/postgresUserRepository');
const GuestRepository =
    require('./repositories/postgres/postgresGuestRepository');
const RegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');
const RegistrationService =
    require('./services/registrationService');

async function main() {
    const userRepository = new UserRepository();
    const guestRepository = new GuestRepository();
    const registrationRepository = new RegistrationRepository();

    const registrationService = new RegistrationService(
        registrationRepository,
        userRepository,
        guestRepository
    );

    let guest;
    let registrationCreated = false;

    try {
        const users = await userRepository.findAll();
        const host = users.find(user => user.role === 'member');

        if (!host) {
            throw new Error('No member account found for the test.');
        }

        guest = await guestRepository.create({
            name: 'Temporary List Test Guest',
            email: `list-test-${Date.now()}@example.com`,
            guestOfUserId: host.id,
            rating: 4
        });

        await registrationRepository.registerGuest(guest.id, 24);
        registrationCreated = true;

        const registered = await registrationService.getRegisteredUsers();
        const waitlisted = await registrationService.getWaitlistedUsers();

        const listedGuest = [...registered, ...waitlisted].find(
            player =>
                player.isGuest &&
                player.email === guest.email
        );

        if (!listedGuest) {
            throw new Error('Guest was not found in either list.');
        }

        if (listedGuest.rating !== 4) {
            throw new Error(
                `Expected rating 4, got ${listedGuest.rating}`
            );
        }

        if ('experienceLevel' in listedGuest) {
            throw new Error(
                'Guest output still contains experienceLevel.'
            );
        }

        console.log('Guest list output:', listedGuest);
        console.log('Guest list output test passed.');
    } catch (error) {
        console.error('Guest list output test failed:', error);
        process.exitCode = 1;
    } finally {
        try {
            if (guest) {
                if (registrationCreated) {
                    await registrationRepository.remove(
                        guest.id,
                        'guest'
                    );
                }

                await guestRepository.delete(guest.id);
            }
        } catch (cleanupError) {
            console.error('Test cleanup failed:', cleanupError);
            process.exitCode = 1;
        }

        await pool.end();
    }
}

main();
