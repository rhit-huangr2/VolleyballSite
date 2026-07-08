const { writeLists } = require('../src/jsonCrud');

const registeredUsers = [
	{
		name: 'Ryan Huang',
		email: 'ryan.huang@example.com',
		password: 'test',
		rating: 5
	},
	{
		name: 'Ava Patel',
		email: 'ava.patel@example.com',
		password: 'test',
		rating: 4
	}
];

const waitlistUsers = [
	{
		name: 'Jordan Lee',
		email: 'jordan.lee@example.com',
		password: 'test',
		rating: 3
	},
	{
		name: 'Mia Chen',
		email: 'mia.chen@example.com',
		password: 'test',
		rating: 5
	},
	{
		name: 'Noah Wilson',
		email: 'noah.wilson@example.com',
		password: 'test',
		rating: 2
	}
];

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