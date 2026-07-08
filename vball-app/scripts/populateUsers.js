const { writeUsers } = require('../src/jsonCrud');

const seededUsers = [
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
	},
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