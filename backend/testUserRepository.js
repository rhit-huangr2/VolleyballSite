
const UserRepository = require('./repositories/postgres/postgresUserRepository');
const pool = require('./db/pool');

async function testRepository() {
    const users = new UserRepository();

    try {
        const result = await users.findAll();
        console.log('Users retrieved:', result.length);
        console.log(result);
    } catch (error) {
        console.error('Repository test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testRepository();
