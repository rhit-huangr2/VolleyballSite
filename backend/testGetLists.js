
const PostgresUserRepository =
    require('./repositories/postgres/postgresUserRepository');

const PostgresGuestRepository =
    require('./repositories/postgres/postgresGuestRepository');

const PostgresRegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');

const RegistrationService =
    require('./services/registrationService');

async function main() {
    const userRepository = new PostgresUserRepository();
    const guestRepository = new PostgresGuestRepository();
    const registrationRepository =
        new PostgresRegistrationRepository();

    const registrationService = new RegistrationService(
        registrationRepository,
        userRepository,
        guestRepository
    );

    try {
        const lists = await registrationService.getLists();

        if (!Array.isArray(lists['registered-users'])) {
            throw new Error('Registered users must be an array.');
        }

        if (!Array.isArray(lists['waitlist-users'])) {
            throw new Error('Waitlisted users must be an array.');
        }

        console.log(
            'Registered entries:',
            lists['registered-users'].length
        );

        console.log(
            'Waitlisted entries:',
            lists['waitlist-users'].length
        );

        console.log('getLists() test passed.');
    } catch (error) {
        console.error('getLists() test failed:', error);
        process.exitCode = 1;
    } finally {
        await require('./db/pool').end();
    }
}

main();
