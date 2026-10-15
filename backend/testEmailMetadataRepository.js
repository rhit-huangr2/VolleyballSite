
const EmailMetadataRepository =
    require('./repositories/postgres/postgresEmailMetadataRepository');

const pool = require('./db/pool');

async function testMetadataRepository() {
    const repository = new EmailMetadataRepository();

    try {
        await repository.set('test-message-id', '<test@example.com>');
        await repository.set('test-flag', false);

        console.log(
            'Message ID:',
            await repository.get('test-message-id')
        );

        console.log(
            'Flag:',
            await repository.get('test-flag')
        );

        console.log('All metadata:', await repository.getAll());
    } catch (error) {
        console.error('Metadata test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testMetadataRepository();
