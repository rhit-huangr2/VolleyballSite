const { writeLists } = require('../backend/data/jsonCrud'); const { registeredUsers } = require('./seedUsers');

const waitlistUsers = [];

async function populateLists() {
	await writeLists({
		'registered-users': registeredUsers,
		'waitlist-users': waitlistUsers
	});

	console.log('Populated lists.json');
	return {
		'registered-users': registeredUsers,
		'waitlist-users': waitlistUsers
	};
}

if (require.main === module) {
	populateLists().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}

module.exports = populateLists;