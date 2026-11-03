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

const { 
	listService, 
	userRepository,	
	guestRepository, 
	registrationRepository,
	registrationService,
	guestService
} = require('./services/serviceFactory');

const {
	sendEmailToOptedInUsers,
} = require('./services/emailService'); 

const {
	registrationOpenEmail,
	volleyballCanceledEmail,
	registrationFullEmail,
	registrationEmail,
	waitlistEmail,
	promotionEmail
} = require('./emailTemplates');

const registrationEvents = require('./registrationEvents');

const {
	hashPassword,
	verifyPassword
} = require('./utils/passwordUtils'); 

const sessions = new Map();
const port = process.env.PORT || 5001;

const MAX_REGISTERED_USERS = 24;

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
	await registrationRepository.clearAll();

	console.log('Weekly player lists cleared.');
}

async function clearPlayerLists() {
	await registrationRepository.clearAll();

	console.log('Weekly player lists cleared.');
}

async function saveRegistrationMessageId(messageId) {
	await emailMetadataRepository.set(
		'registration-message-id',
		messageId
	);
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

registrationEvents.on('registrationFull', async () => {
	try {
		console.log('*** registrationFull EVENT RECEIVED ***');

		// Check whether the full-registration email
		// has already been sent this week.
		const alreadySent = await emailMetadataRepository.get(
			'registration-full-email-sent'
		);

		if (alreadySent) {
			console.log(
				'Registration-full email already sent this week. Skipping.'
			);
			return;
		}

		const users = await userRepository.findAll();

		const registrationMessageId = await emailMetadataRepository.get(
			'registration-message-id'
		);

		if (!registrationMessageId) {
			console.error('No registration-open Message-ID found.');
			return;
		}

		await sendEmailToOptedInUsers(
			users,
			registrationFullEmail,
			registrationMessageId
		);

		// Mark the email as sent in PostgreSQL.
		await emailMetadataRepository.set(
			'registration-full-email-sent',
			true
		);

		console.log(
			'Registration-full email sent and marked as sent.'
		);

	} catch (error) {
		console.error(
			'Failed to send registration-full email:',
			error
		);
	}
});

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

	if (
		request.method === 'GET' &&
		request.url.split('?')[0] === '/api/admin/guests'
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

			if (!loggedInUser || loggedInUser.role !== 'admin') {
				sendJson(response, 403, {
					error: 'Admin access required.'
				});
				return;
			}

			const guests = await guestRepository.findAll();

			sendJson(response, 200, guests);

		} catch (error) {
			console.error('Failed to load guests:', error);

			sendJson(response, 500, {
				error: 'Unable to load guests.'
			});
		}

		return;
	}

	if (request.url === '/api/admin/users' && request.method === 'GET') {
		try {
			const sessionId = getCookie(request, 'sessionId');

			if (!sessionId) {
				sendJson(response, 401, {
					error: 'Not signed in.'
				});
				return;
			}

			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser || loggedInUser.role !== 'admin') {
				sendJson(response, 403, {
					error: 'Admin access required.'
				});
				return;
			}

			const users = await userRepository.findAll();

			sendJson(response, 200, users);

		} catch (error) {
			console.error('Failed to load users:', error);

			sendJson(response, 500, {
				error: 'Unable to load users.'
			});
		}

		return;
	}

	if (request.url.startsWith('/api/admin/users/') && request.method === 'PUT') {
		const sessionId = getCookie(request, 'sessionId');
		const loggedInUser = sessions.get(sessionId);

		if (!loggedInUser || loggedInUser.role !== 'admin') {
			sendJson(response, 403, {
				error: 'Unauthorized'
			});
			return;
		}

		try {
			const email = decodeURIComponent(
				request.url.split('/api/admin/users/')[1]
			);

			const updates = await readRequestBody(request);

			console.log("updates:", updates);

			const user = await userRepository.findByEmail(email);

			if (!user) {
				sendJson(response, 404, {
					error: "User not found"
				});
				return;
			}

			const updatedUser = await userRepository.update(user.id, updates);

			sendJson(response, 200, {
				message: "User updated",
				user: updatedUser
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
			const users = await userRepository.findAll();

			await sendEmailToOptedInUsers(
				users,
				volleyballCanceledEmail
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

	if (
		request.url === '/api/lists-db-test' &&
		request.method === 'GET'
	) {
		try {
			const lists = await listService.getLists();

			sendJson(response, 200, lists);
		} catch (error) {
			console.error('PostgreSQL list test failed:', error);

			sendJson(response, 500, {
				error: 'Unable to load PostgreSQL player lists.'
			});
		}

		return;
	}

	if (request.url === '/api/lists' && request.method === 'GET') {
		try {
			const lists = await listService.getLists();

			sendJson(response, 200, lists);
		} catch (error) {
			console.error('Failed to load PostgreSQL player lists:', error);

			sendJson(response, 500, {
				error: 'Unable to load player lists.'
			});
		}

		return;
	}

	if (request.url === '/api/lists' && request.method === 'POST') {
		try {
			const sessionId = getCookie(request, 'sessionId');
			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser) {
				sendJson(response, 401, {
					error: 'You must be signed in to register.'
				});
				return;
			}

			const result = await registrationService.registerUser(
				loggedInUser.id
			);

			if (result.alreadyRegistered) {
				sendJson(response, 409, {
					error: 'You are already registered.'
				});
				return;
			}

			if (!result.wasFull && result.isNowFull) {
				registrationEvents.emit('registrationFull');
				console.log('Registration is now full. Event emitted.');
			}

			sendJson(response, 201, {
				message: 'Registration successful.',
				status: result.status
			});
		} catch (error) {
			console.error('Error registering user:', error);

			sendJson(response, 500, {
				error: 'Unable to register user.'
			});
		}

		return;
	}

	if (request.url === '/api/admin/lists' && request.method === 'PUT') {
		const sessionId = getSessionId(request);
		const loggedInUser = sessions.get(sessionId);

		if (!loggedInUser || loggedInUser.role !== 'admin') {
			sendJson(response, 403, { error: 'Unauthorized' });
			return;
		}

		try {
			const body = await readRequestBody(request);
			const { registeredUsers, waitlistUsers } = body;

			await registrationRepository.replaceAllLists(
				registeredUsers,
				waitlistUsers
			);

			sendJson(response, 200, { message: 'Lists updated successfully.' });
		} catch (error) {
			console.error('Failed to update PostgreSQL player lists:', error);

			sendJson(response, 500, {
				error: 'Unable to update player lists.'
			});
		}

		return;
	}


	if (request.url === '/api/admin/lists-db-test' && request.method === 'PUT') {
		try {
			const sessionId = getCookie(request, 'sessionId');

			if (!sessionId) {
				sendJson(response, 401, {
					error: 'Not signed in.'
				});
				return;
			}

			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser || loggedInUser.role !== 'admin') {
				sendJson(response, 403, {
					error: 'Admin access required.'
				});
				return;
			}

			const body = await readRequestBody(request);

			const registeredUsers = Array.isArray(body.registeredUsers)
				? body.registeredUsers
				: [];

			const waitlistUsers = Array.isArray(body.waitlistUsers)
				? body.waitlistUsers
				: [];

			await registrationRepository.replaceAllLists(
				registeredUsers,
				waitlistUsers
			);

			sendJson(response, 200, {
				message: 'PostgreSQL lists updated successfully.'
			});
		} catch (error) {
			console.error('Failed to update PostgreSQL lists:', error);

			sendJson(response, 500, {
				error: 'Unable to update PostgreSQL lists.'
			});
		}

		return;
	}

	if (request.url === '/api/guest' && request.method === 'POST') {
		try {
			const sessionId = getCookie(request, 'sessionId');

			if (!sessionId) {
				sendJson(response, 401, { message: 'Not signed in.' });
				return;
			}

			const loggedInUser = sessions.get(sessionId);

			if (!loggedInUser) {
				sendJson(response, 401, { message: 'Session expired.' });
				return;
			}

			const body = await readRequestBody(request);

			const firstName = String(body.firstName || '').trim();
			const lastName = String(body.lastName || '').trim();
			const email = String(body.email || '').trim().toLowerCase();
			const experienceLevel = String(body.experienceLevel || '').trim();

			if (!firstName || !lastName || !email || !experienceLevel) {
				sendJson(response, 400, {
					message: 'All guest fields are required.'
				});
				return;
			}

			// Create the guest in PostgreSQL.
			const guest = await guestService.createGuest({
				name: `${firstName} ${lastName}`,
				email,
				registeredByEmail: loggedInUser.email,
				experienceLevel
			});

			// Register the guest or place them on the waitlist.
			const registration = await registrationService.registerGuest(guest.id);

			sendJson(response, 201, {
				message: 'Guest successfully registered.',
				guest: {
					name: guest.name,
					email: guest.email,
					guestOf: loggedInUser.email,
					experienceLevel
				},
				status: registration.status
			});

		} catch (error) {
			console.error('Error registering guest:', error);

			if (
				error.message === 'This email is already in use' ||
				error.message === 'Invalid experience level' ||
				error.message === 'Registering member not found'
			) {
				sendJson(response, 400, { message: error.message });
				return;
			}

			sendJson(response, 500, {
				message: 'Unable to register guest.'
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

			const user = await userRepository.findByEmail(loggedInUser.email);

			if (!user) {
				sendJson(response, 404, {
					error: 'User not found.'
				});
				return;
			}

			// Toggle the email preference
			const updatedUser = await userRepository.update(user.id, {
				emailOptIn: !user.emailOptIn
			});

			// Keep the session's user information synchronized
			loggedInUser.emailOptIn = updatedUser.emailOptIn;

			sendJson(response, 200, {
				message: 'Email preference updated.',
				emailOptIn: updatedUser.emailOptIn
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

			const existingUser = await userRepository.findByEmail(email);

			if (existingUser) {
				sendJson(response, 409, {
					error: 'An account with that email already exists.'
				});
				return;
			}

			const passwordHash = await hashPassword(password);

			const user = await userRepository.create({
				name,
				email,
				passwordHash,
				rating,
				role,
				emailOptIn
			});

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
			const user = await userRepository.findByEmail(email);

			if (!user || !user.passwordHash) {
				sendJson(response, 401, {
					error: 'Invalid email or password.'
				});
				return;
			}

			const passwordMatches = await verifyPassword(
				password,
				user.passwordHash
			);

			if (!passwordMatches) {
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

			const withdrawn = await registrationService.withdrawUser(
				loggedInUser.id
			);

			if (!withdrawn) {
				sendJson(response, 404, {
					error: 'You are not registered or waitlisted.'
				});
				return;
			}

			sendJson(response, 200, {
				message: 'Successfully withdrawn.'
			});

		} catch (error) {
			console.error('Withdrawal error:', error);

			sendJson(response, 500, {
				error: 'Unable to process withdrawal.'
			});
		}

		return;
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

		// console.log('Logged-in user:', loggedInUser);

		if (!loggedInUser) {
			sendJson(response, 401, {
				error: 'Session expired or invalid'
			});
			return;
		}

		const registeredUsers =
			await registrationRepository.findRegistered();

		const waitlistUsers =
			await registrationRepository.findWaitlisted();

		const isRegistered =
			registeredUsers.some(
				(entry) => String(entry.id) === String(loggedInUser.id)
			) ||
			waitlistUsers.some(
				(entry) => String(entry.id) === String(loggedInUser.id)
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

// * * * * * for testing every minute
cron.schedule('0 9 * * 6', async () => {
	console.log('Running Saturday volleyball automation...');

	try {
		const users = await userRepository.findAll();

		// Clear registered and waitlisted players in PostgreSQL.
		await clearPlayerLists();

		// Reset the full-registration email flag in PostgreSQL.
		await emailMetadataRepository.set(
			'registration-full-email-sent',
			false
		);

		const emailInfo = await sendEmailToOptedInUsers(
			users,
			registrationOpenEmail
		);

		console.log(
			'Registration email Message-ID:',
			emailInfo?.messageId
		);

		if (emailInfo?.messageId) {
			await saveRegistrationMessageId(emailInfo.messageId);
		}

		console.log('Saturday volleyball automation completed.');

	} catch (error) {
		console.error('Saturday automation failed:', error);
	}
}, {
	timezone: 'America/New_York'
});

cron.schedule('0 16 * * 1', async () => {
	console.log('Running Monday volleyball automation...');

	try {
		const users = await userRepository.findAll();

		// Retrieve registered players from PostgreSQL.
		const registeredUsers =
			await registrationRepository.findRegistered();

		if (registeredUsers.length < 10) {
			await sendEmailToOptedInUsers(
				users,
				volleyballCanceledEmail
			);
		}

		console.log('Monday volleyball automation completed.');

	} catch (error) {
		console.error('Monday automation failed:', error);
	}
}, {
	timezone: 'America/New_York'
});

server.listen(port, () => {
	console.log(`Registration API running on http://localhost:${port}`);
});