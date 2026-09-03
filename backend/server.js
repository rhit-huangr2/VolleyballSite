require('dotenv').config();


const http = require('http');
const crypto = require('crypto');
const cron = require('node-cron');
const {
	readUsers,
	writeUsers,
	readLists,
	writeLists,
	createListEntry,
	createUser,
	updateUser,
	deleteUser,
	updateListEntry,
	deleteListEntry
} = require('./data/jsonCrud');
const { sendEmail, sendEmailToOptedInUsers } = require('./emailService');
const {
	registrationOpenEmail,
	waitlistEmail,
	promotionEmail
} = require('./emailTemplates');
const sessions = new Map();
const port = process.env.PORT || 5001;

function sendJson(response, statusCode, payload) {
	response.writeHead(statusCode, {
		'Content-Type': 'application/json'
	});
	response.end(JSON.stringify(payload));
}

function getCookie(request, name) {
	const cookies = request.headers.cookie || '';

	const cookie = cookies
		.split('; ')
		.find(row => row.startsWith(`${name}=`));

	return cookie
		? decodeURIComponent(cookie.split('=')[1])
		: null;
}

async function clearPlayerLists() {
	const lists = await readLists();

	lists['registered-users'] = [];
	lists['waitlist-users'] = [];

	await writeLists(lists);

	console.log('Weekly player lists cleared.');
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
	console.log('Request URL:', request.url);
	console.log('Request method:', request.method);

	if (request.method === 'OPTIONS') {
		response.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});
		response.end();
		return;
	}

	if (request.url === '/api/admin/users' && request.method === 'GET') {
		try {
			const users = await readUsers();

			sendJson(response, 200, users);
		} catch (error) {
			sendJson(response, 500, {
				error: 'Unable to load users.'
			});
		}

		return;
	}
	if (request.url.startsWith('/api/admin/users/') && request.method === 'PUT') {
		try {
			const email = decodeURIComponent(
				request.url.split('/api/admin/users/')[1]
			);

			const updates = await readRequestBody(request);

			console.log("updates:", updates);

			const data = await readUsers();
			// console.log("users:", data);
			const user = data.find(
				u => u.email === email
			);

			if (!user) {
				sendJson(response, 404, {
					error: "User not found"
				});
				return;
			}

			Object.assign(user, updates);

			await writeUsers(data);

			sendJson(response, 200, {
				message: "User updated",
				user
			});

		} catch (error) {
			console.error(error);

			sendJson(response, 500, {
				error: "Failed to update user"
			});
		}

		return;
	}

	if (
		request.url === '/api/test-email' &&
		request.method === 'POST'
	) {
		try {
			const users = await readUsers();

			await sendEmailToOptedInUsers(
				users,
				registrationOpenEmail
			);

			sendJson(response, 200, {
				message: 'Registration emails sent successfully.'
			});

		} catch (error) {
			console.error('Registration email error:', error);

			sendJson(response, 500, {
				error: 'Unable to send registration emails.'
			});
		}

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
        try {
            const body = await readRequestBody(request);
            const name = String(body.name || '').trim();
            const email = String(body.email || '').trim();
            const password = String(body.password || '');
            const rating = Number(body.rating || -1);

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

	if (request.url === '/api/guest' && request.method === 'POST') {
		try {
			// Get session ID from cookie
			const sessionId = getCookie(request, 'sessionId');

			if (!sessionId) {
				sendJson(response, 401, {
					error: 'Not signed in.'
				});
				return;
			}

			// Get logged-in user
			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser) {
				sendJson(response, 401, {
					error: 'Session expired or invalid.'
				});
				return;
			}

			// Read guest information
			const body = await readRequestBody(request);

			const firstName = String(body.firstName || '').trim();
			const lastName = String(body.lastName || '').trim();
			const email = String(body.email || '').trim().toLowerCase();
			const experienceLevel = String(
				body.experienceLevel || ''
			).trim();

			// Validate guest information
			if (
				!firstName ||
				!lastName ||
				!email ||
				!experienceLevel
			) {
				sendJson(response, 400, {
					error: 'All guest fields are required.'
				});
				return;
			}

			const hostEmail = loggedInUser.email
				.trim()
				.toLowerCase();

			// Load lists
			const lists = await readLists();

			const registeredUsers = lists['registered-users'] || [];
			const waitlistUsers = lists['waitlist-users'] || [];

			// Find host
			const registeredHost = registeredUsers.find(
				user =>
					user.email.trim().toLowerCase() === hostEmail
			);

			const waitlistHost = waitlistUsers.find(
				user =>
					user.email.trim().toLowerCase() === hostEmail
			);

			// Determine which list the guest belongs in
			let targetList;

			if (registeredHost) {
				targetList = registeredUsers;
			}
			else if (waitlistHost) {
				targetList = waitlistUsers;
			}
			else {
				sendJson(response, 400, {
					error: 'You must be registered before adding a guest.'
				});
				return;
			}

			// Make sure the guest isn't already registered
			const allPlayers = [
				...registeredUsers,
				...waitlistUsers
			];

			const duplicate = allPlayers.find(
				player =>
					player.email &&
					player.email.trim().toLowerCase() === email
			);

			if (duplicate) {
				sendJson(response, 409, {
					error: 'A player or guest with this email already exists.'
				});
				return;
			}

			// Create guest
			const guest = {
				name: `${firstName} ${lastName}`,
				email: email,
				guestOf: hostEmail,
				experienceLevel: experienceLevel
			};

			// Add guest to the same list as their host
			targetList.push(guest);

			// Save lists.json
			await writeLists(lists);

			sendJson(response, 201, {
				message: 'Guest successfully registered.',
				guest
			});

		} catch (error) {
			console.error('Guest registration error:', error);

			sendJson(response, 500, {
				error: 'Unable to register guest.'
			});
		}

		return;
	}

	if (
		request.url === '/api/email-preference' &&
		request.method === 'PUT'
	) {
		try {
			const sessionId = getCookie(request, 'sessionId');

			if (!sessionId) {
				sendJson(response, 401, {
					error: 'Not signed in.'
				});
				return;
			}

			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser) {
				sendJson(response, 401, {
					error: 'Session expired or invalid.'
				});
				return;
			}

			const users = await readUsers();

			const user = users.find(
				user =>
					user.email.toLowerCase() ===
					loggedInUser.email.toLowerCase()
			);

			if (!user) {
				sendJson(response, 404, {
					error: 'User not found.'
				});
				return;
			}

			// Toggle the email preference
			user.emailOptIn = !user.emailOptIn;

			await writeUsers(users);

			// Keep the session's user information synchronized
			loggedInUser.emailOptIn = user.emailOptIn;

			sendJson(response, 200, {
				message: 'Email preference updated.',
				emailOptIn: user.emailOptIn
			});

		} catch (error) {
			console.error('Email preference error:', error);

			sendJson(response, 500, {
				error: 'Unable to update email preference.'
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
			const rating = -1; // Default rating for new users
			const role = 'member'; // Default role for new users
			const emailOptIn = true; // Default email opt-in for new users

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


			const user = await createUser({ name, email, password, rating, role, emailOptIn });

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

			// Create a unique session token
			const sessionId = crypto.randomUUID();

			// Store the logged-in user on the server
			sessions.set(sessionId, user);

			// Send the session ID as a cookie
			response.setHeader(
				'Set-Cookie',
				`sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`,
			);

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

	if (request.url === '/api/me' && request.method === 'GET') {
		const cookies = request.headers.cookie || '';

		const sessionId = cookies
			.split('; ')
			.find(cookie => cookie.startsWith('sessionId='))
			?.split('=')[1];

		const user = sessions.get(sessionId);

		if (!user) {
			sendJson(response, 401, {
				error: 'Not signed in.'
			});
			return;
		}

		sendJson(response, 200, {
			user
		});

		return;
	}

	if (request.url === '/api/signout' && request.method === 'POST') {
		const cookies = request.headers.cookie || '';

		const sessionId = cookies
			.split('; ')
			.find(cookie => cookie.startsWith('sessionId='))
			?.split('=')[1];

		if (sessionId) {
			sessions.delete(sessionId);
		}

		response.setHeader(
			'Set-Cookie',
			'sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
		);

		sendJson(response, 200, {
			message: 'Signed out successfully.'
		});

		return;
	}

	if (request.url === '/api/withdraw' && request.method === 'POST') {
		try {
			const sessionId = getCookie(request, 'sessionId');

			if (!sessionId) {
				sendJson(response, 401, {
					error: 'Not signed in.'
				});
				return;
			}

			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser) {
				sendJson(response, 401, {
					error: 'Session expired or invalid.'
				});
				return;
			}

			const lists = await readLists();

			const registeredUsers = lists['registered-users'] || [];
			const waitlistUsers = lists['waitlist-users'] || [];

			const email = loggedInUser.email.trim().toLowerCase();

			const registeredIndex = registeredUsers.findIndex(
				(player) => player.email.trim().toLowerCase() === email
			);

			const waitlistIndex = waitlistUsers.findIndex(
				(player) => player.email.trim().toLowerCase() === email
			);

			// User is a registered player
			if (registeredIndex !== -1) {
				// Remove them from registered users
				registeredUsers.splice(registeredIndex, 1);

				// Promote the first waitlisted player
				if (waitlistUsers.length > 0) {
					const promotedPlayer = waitlistUsers.shift();

					registeredUsers.push(promotedPlayer);
				}
			}

			// User is a waitlisted player
			else if (waitlistIndex !== -1) {
				waitlistUsers.splice(waitlistIndex, 1);
			}

			// User is not in either list
			else {
				sendJson(response, 404, {
					error: 'You are not registered or waitlisted.'
				});
				return;
			}

			await writeLists(lists);

			sendJson(response, 200, {
				message: 'Successfully withdrawn.'
			});

			return;

		} catch (error) {
			console.error('Withdrawal error:', error);

			sendJson(response, 500, {
				error: 'Unable to process withdrawal.'
			});

			return;
		}
	}
	
	if (
		request.url === '/api/registration-status' &&
		request.method === 'GET'
	) {
		const sessionId = getCookie(request, 'sessionId');

		console.log('Session ID:', sessionId);

		if (!sessionId) {
			sendJson(response, 401, {
				error: 'Not signed in'
			});
			return;
		}

		const loggedInUser = sessions.get(sessionId);

		console.log('Logged-in user:', loggedInUser);

		if (!loggedInUser) {
			sendJson(response, 401, {
				error: 'Session expired or invalid'
			});
			return;
		}

		const lists = await readLists();

		const registeredUsers = lists['registered-users'] || [];
		const waitlistUsers = lists['waitlist-users'] || [];

		const isRegistered =
			registeredUsers.some(
				(entry) =>
					entry.email.trim().toLowerCase() ===
					loggedInUser.email.trim().toLowerCase()
			) ||
			waitlistUsers.some(
				(entry) =>
					entry.email.trim().toLowerCase() ===
					loggedInUser.email.trim().toLowerCase()
			);
		console.log('loggedInUser email:', loggedInUser.email);
		console.log('Registered users:', registeredUsers.map(u => u.email));
		console.log('Is registered or waitlisted:', isRegistered);
		console.log('Email user:', process.env.EMAIL_USER);
		console.log(
			'Email password loaded:',
			Boolean(process.env.EMAIL_PASSWORD)
		);
		sendJson(response, 200, {
			isRegistered
		});

		return;
	}

	sendJson(response, 404, {
		error: 'Not found'
	});
});

cron.schedule('0 8 * * 6', async () => {
	console.log('Running Saturday volleyball automation...');

	try {
		const users = await readUsers();

		await clearPlayerLists();
		await sendEmailToOptedInUsers(
			users,
			registrationOpenEmail
		);

		console.log('Saturday volleyball automation completed.');
	} catch (error) {
		console.error('Saturday automation failed:', error);
	}
}, {
	timezone: 'America/New_York'
});

server.listen(port, () => {
	console.log(`Registration API running on http://localhost:${port}`);
});