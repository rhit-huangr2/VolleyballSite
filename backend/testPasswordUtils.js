
const {
    hashPassword,
    verifyPassword
} = require('./utils/passwordUtils');

async function test() {
    const password = 'example-password';
    const hash = await hashPassword(password);

    console.log('Hash generated:', hash !== password);
    console.log(
        'Correct password accepted:',
        await verifyPassword(password, hash)
    );
    console.log(
        'Incorrect password rejected:',
        !(await verifyPassword('wrong-password', hash))
    );
}

test().catch(console.error);
