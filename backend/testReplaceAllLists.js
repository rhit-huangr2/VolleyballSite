
const pool = require('./db/pool');
const PostgresRegistrationRepository = require('./repositories/postgres/postgresRegistrationRepository');

const registrationRepository = new PostgresRegistrationRepository();

function getIds(people) {
    return people.map(person => ({
        id: String(person.id),
        isGuest: person.isGuest
    }));
}

async function main() {
    let originalRegistered;
    let originalWaitlisted;

    try {
        // Save the current lists so we can restore them.
        originalRegistered =
            await registrationRepository.findRegistered();

        originalWaitlisted =
            await registrationRepository.findWaitlisted();

        const originalRegisteredIds = getIds(originalRegistered);
        const originalWaitlistedIds = getIds(originalWaitlisted);

        console.log('Original registered:', originalRegistered.length);
        console.log('Original waitlisted:', originalWaitlisted.length);

        // Replace the lists with the exact same people in the same order.
        await registrationRepository.replaceAllLists(
            originalRegistered,
            originalWaitlisted
        );

        const updatedRegistered =
            await registrationRepository.findRegistered();

        const updatedWaitlisted =
            await registrationRepository.findWaitlisted();

        const registeredMatch =
            JSON.stringify(getIds(updatedRegistered)) ===
            JSON.stringify(originalRegisteredIds);

        const waitlistedMatch =
            JSON.stringify(getIds(updatedWaitlisted)) ===
            JSON.stringify(originalWaitlistedIds);

        if (!registeredMatch || !waitlistedMatch) {
            throw new Error('The lists do not match the original data.');
        }

        console.log('Registered list preserved:', registeredMatch);
        console.log('Waitlist preserved:', waitlistedMatch);
        console.log('replaceAllLists test passed.');
    } catch (error) {
        console.error('Test failed:', error);
        process.exitCode = 1;
    } finally {
        // Restore the original lists even if an assertion fails.
        if (
            originalRegistered !== undefined &&
            originalWaitlisted !== undefined
        ) {
            try {
                await registrationRepository.replaceAllLists(
                    originalRegistered,
                    originalWaitlisted
                );
                console.log('Original lists restored.');
            } catch (restoreError) {
                console.error(
                    'CRITICAL: Could not restore original lists:',
                    restoreError
                );
                process.exitCode = 1;
            }
        }

        await pool.end();
    }
}

main();
