
const RegistrationRepository =
    require('./repositories/postgres/postgresRegistrationRepository');
const pool = require('./db/pool');

async function test() {
    const repository = new RegistrationRepository();

    try {
        const registered = await repository.findRegistered();
        const waitlisted = await repository.findWaitlisted();

        console.log('\n--- Registered players ---');
        console.log('Count:', registered.length);

        registered.forEach((person, index) => {
            console.log(
                `${index + 1}. ${person.name} (${person.isGuest ? 'Guest' : 'Member'})`
            );
        });

        console.log('\n--- Waitlisted players ---');
        console.log('Count:', waitlisted.length);

        waitlisted.forEach((person, index) => {
            console.log(
                `${index + 1}. ${person.name} (${person.isGuest ? 'Guest' : 'Member'})`
            );
        });

        console.log('\n--- Checks ---');

        console.log(
            'Registered positions are ordered:',
            registered.every((person, index) =>
                index === 0 || registered[index - 1].position <= person.position
            )
        );

        console.log(
            'Waitlisted positions are ordered:',
            waitlisted.every((person, index) =>
                index === 0 || waitlisted[index - 1].position <= person.position
            )
        );

        console.log(
            'Every registered entry has a person type:',
            registered.every(person => typeof person.isGuest === 'boolean')
        );

        console.log(
            'Every waitlisted entry has a person type:',
            waitlisted.every(person => typeof person.isGuest === 'boolean')
        );
    } finally {
        await pool.end();
    }
}

test().catch(error => {
    console.error('Registration repository test failed:', error);
    process.exitCode = 1;
});
