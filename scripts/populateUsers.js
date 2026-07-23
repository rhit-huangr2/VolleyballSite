const { writeUsers } = require('../src/jsonCrud');
const { registeredUsers: seededUsers } = require('./seedUsers');

async function populateUsers() {
	await writeUsers(seededUsers);
	console.log('Populated users.json');
	return seededUsers;
}

if (require.main === module) {
	populateUsers().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}

module.exports = populateUsers;