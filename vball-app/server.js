const http = require('http');
const { createListEntry, createUser, readLists, readUsers } = require('./src/jsonCrud');

const port = process.env.PORT || 5001;

function sendJson(response, statusCode, payload) {
	response.writeHead(statusCode, {
		'Content-Type': 'application/json'
	});
	response.end(JSON.stringify(payload));
}

async function readRequestBody(request) {
	return new Promise((resolve, reject) => {
		let body = '';

		request.on('data', (chunk) => {
			body += chunk;
		});

		request.on('end', () => {
			if (!body) {
				resolve({});
				return;
			}

			try {
				resolve(JSON.parse(body));
			} catch (error) {
				reject(error);
			}
		});

		request.on('error', reject);
	});
}

const server = http.createServer(async (request, response) => {
	if (request.method === 'OPTIONS') {
		response.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});
		response.end();
		return;
	}

	if (request.url === '/api/health' && request.method === 'GET') {
		sendJson(response, 200, { ok: true });
		return;
	}

	if (request.url === '/api/lists' && request.method === 'GET') {
		try {
			const lists = await readLists();
			sendJson(response, 200, lists);
		} catch (error) {
			sendJson(response, 500, {
				error: 'Unable to load player lists.'
			});
		}

		return;
	}

    if (request.url === '/api/lists' && request.method === 'POST') {
        console.log('Received POST request to /api/lists'); // Debugging log
        try {
            const body = await readRequestBody(request);
            const name = String(body.name || '').trim();
            const email = String(body.email || '').trim();
            const password = String(body.password || '');
            const rating = Number(body.rating || 0);

            const lists = await readLists();
            const placementListName = lists['registered-users'].length >= 24 ? 'waitlist-users' : 'registered-users';
            const duplicateEmail = lists['registered-users'].find((player) => player.email === email) || lists['waitlist-users'].find((player) => player.email === email);

            if (duplicateEmail) {
                sendJson(response, 409, {
                    error: 'You are already registered.'
                });
                return;
            }
            await createListEntry(placementListName, { name, email, password, rating });

            sendJson(response, 201, { message: 'List entry created successfully.' });
        } catch (error) {
            sendJson(response, 500, {
                error: 'Unable to create list entry.'
            });
        }

        return;
    }

	if (request.url === '/api/signup' && request.method === 'POST') {
		try {
			const body = await readRequestBody(request);
			const name = String(body.name || '').trim();
			const email = String(body.email || '').trim();
			const password = String(body.password || '');

			if (!name || !email || !password) {
				sendJson(response, 400, {
					error: 'Full name, email, and password are required.'
				});
				return;
			}

			const users = await readUsers();
			const duplicateEmail = users.find((user) => user.email === email);

			if (duplicateEmail) {
				sendJson(response, 409, {
					error: 'An account with that email already exists.'
				});
				return;
			}


			const user = await createUser({ name, email, password });

			sendJson(response, 201, {
				message: 'Account created successfully.',
				user,
			});
		} catch (error) {
			sendJson(response, 400, {
				error: 'Invalid registration payload.'
			});
		}

		return;
	}

	if (request.url === '/api/signin' && request.method === 'POST') {
		try {
			const body = await readRequestBody(request);
			const email = String(body.email || '').trim();
			const password = String(body.password || '');

			if (!email || !password) {
				sendJson(response, 400, {
					error: 'Email and password are required.'
				});
				return;
			}

			const users = await readUsers();
			const user = users.find((entry) => entry.email === email && entry.password === password);

			if (!user) {
				sendJson(response, 401, {
					error: 'Invalid email or password.'
				});
				return;
			}

			sendJson(response, 200, {
				message: 'Signed in successfully.',
				user
			});
		} catch (error) {
			sendJson(response, 400, {
				error: 'Invalid sign in payload.'
			});
		}

		return;
	}

	sendJson(response, 404, {
		error: 'Not found'
	});
});

server.listen(port, () => {
	console.log(`Registration API running on http://localhost:${port}`);
});