
const PostgresUserRepository =
    require('../repositories/postgres/postgresUserRepository');

const PostgresGuestRepository =
    require('../repositories/postgres/postgresGuestRepository');

const PostgresRegistrationRepository =
    require('../repositories/postgres/postgresRegistrationRepository');

const PostgresEmailMetadataRepository =
    require('../repositories/postgres/postgresEmailMetadataRepository');

const RegistrationService =
    require('./registrationService');

const GuestService = require('./guestService');

const ListService = require('./listService');

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

const guestService = new GuestService(
    guestRepository,
    userRepository
);

const listService = new ListService(
    registrationService,
    emailMetadataRepository
);

module.exports = {
    userRepository,
    guestRepository,
    registrationRepository,
    emailMetadataRepository,
    registrationService,
    guestService,
    listService
};
