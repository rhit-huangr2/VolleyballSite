
const PostgresUserRepository =
    require('./repositories/postgres/postgresUserRepository');

const PostgresGuestRepository =
    require('./repositories/postgres/postgresGuestRepository');

const PostgresRegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');

const PostgresEmailMetadataRepository =
    require('./repositories/postgres/postgresEmailMetadataRepository');

const RegistrationService =
    require('./services/registrationService');

const ListService =
    require('./services/listService');

async function main() {
    const userRepository = new PostgresUserRepository();
    const guestRepository = new PostgresGuestRepository();
    const registrationRepository =
        new PostgresRegistrationRepository();
    const emailMetadataRepository =
        new PostgresEmailMetadataRepository();

    const registrationService = new RegistrationService(
        registrationRepository,
        userRepository,
        guestRepository
    );

    const listService = new ListService(
        registrationService,
        emailMetadataRepository
    );

    try {
        const lists = await listService.getLists();

        for (const key of [
            'registered-users',
            'waitlist-users',
            'email-metadata'
        ]) {
            if (
                !Object.prototype.hasOwnProperty.call(lists, key)
            ) {
                throw new Error(`Missing expected key: ${key}`);
            }
        }

        if (
            !Array.isArray(lists['registered-users']) ||
            !Array.isArray(lists['waitlist-users'])
        ) {
            throw new Error('Player lists must be arrays.');
        }

        if (
            !lists['email-metadata'] ||
            typeof lists['email-metadata'] !== 'object' ||
            Array.isArray(lists['email-metadata'])
        ) {
            throw new Error('Email metadata must be an object.');
        }

        console.log(
            'Registered entries:',
            lists['registered-users'].length
        );
        console.log(
            'Waitlisted entries:',
            lists['waitlist-users'].length
        );
        console.log(
            'Email metadata keys:',
            Object.keys(lists['email-metadata'])
        );

        console.log('ListService test passed.');
    } catch (error) {
        console.error('ListService test failed:', error);
        process.exitCode = 1;
    } finally {
        await require('./db/pool').end();
    }
}

main();
