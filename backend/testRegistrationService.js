const PostgresUserRepository =
    require('./repositories/postgres/postgresUserRepository');

const PostgresRegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');

const RegistrationService =
    require('./services/registrationService');

const pool = require('./db/pool');

async function testRegistrationService() {
    const userRepository = new PostgresUserRepository();
    const registrationRepository =
        new PostgresRegistrationRepository();

    const service = new RegistrationService(
        registrationRepository,
        userRepository
    );

    try {
        console.log(
            'Registered users:',
            await service.getRegisteredUsers()
        );

        console.log(
            'Waitlisted users:',
            await service.getWaitlistedUsers()
        );
    } catch (error) {
        console.error('Service test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testRegistrationService();