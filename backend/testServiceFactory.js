
const services = require('./services/serviceFactory');

async function main() {
    const expectedExports = [
        'userRepository',
        'guestRepository',
        'registrationRepository',
        'emailMetadataRepository',
        'registrationService',
        'listService'
    ];

    try {
        for (const name of expectedExports) {
            if (!services[name]) {
                throw new Error(
                    `Service factory is missing: ${name}`
                );
            }
        }

        const lists = await services.listService.getLists();

        console.log('Factory exports verified:', expectedExports);
        console.log(
            'Registered entries:',
            lists['registered-users'].length
        );
        console.log(
            'Waitlisted entries:',
            lists['waitlist-users'].length
        );
        console.log('Service factory test passed.');
    } catch (error) {
        console.error('Service factory test failed:', error);
        process.exitCode = 1;
    } finally {
        await require('./db/pool').end();
    }
}

main();
