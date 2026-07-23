const populateUsers = require('./populateUsers');
const populateLists = require('./populateLists');

async function populateJsonFiles(mode = 'all') {
	if (mode === 'users') {
		await populateUsers();
		return;
	}

	if (mode === 'lists') {
		await populateLists();
		return;
	}

	if (mode !== 'all') {
		throw new Error(`Unknown populate mode: ${mode}`);
	}

	await populateUsers();
	await populateLists();

	console.log('Populated users.json and lists.json');
}

if (require.main === module) {
	const mode = process.argv[2] || 'all';
	populateJsonFiles(mode).catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}

module.exports = populateJsonFiles;