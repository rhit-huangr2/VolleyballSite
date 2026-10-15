
require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db/pool');

const dataDir = path.join(__dirname, 'data');
const usersFilePath = path.join(dataDir, 'users.json');
const listsFilePath = path.join(dataDir, 'lists.json');

const SALT_ROUNDS = 12;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

async function readJson(filePath) {
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents);
}

async function findUserByEmail(client, email) {
    const result = await client.query(
        'SELECT * FROM users WHERE LOWER(email) = $1',
        [normalizeEmail(email)]
    );
    return result.rows[0] || null;
}

async function importUser(client, entry, { isGuest = false } = {}) {
    if (!entry || !entry.email || !entry.name) {
        throw new Error('Found a user or guest without a name or email.');
    }

    const email = String(entry.email).trim();
    const existing = await findUserByEmail(client, email);

    // If the account already exists, reuse it instead of duplicating it.
    if (existing) {
        return existing.id;
    }

    // Never import a plaintext password into password_hash.
    // Existing account passwords are hashed; guests normally have no password.
    let passwordHash = null;
    if (!isGuest && entry.password) {
        passwordHash = await bcrypt.hash(entry.password, SALT_ROUNDS);
    }

    const result = await client.query(
        `INSERT INTO users (
            name, email, password_hash, rating, role,
            email_opt_in, is_guest, guest_of_email, experience_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
            entry.name,
            email,
            passwordHash,
            entry.rating ?? null,
            isGuest ? null : (entry.role ?? 'member'),
            isGuest ? null : (entry.emailOptIn ?? null),
            isGuest,
            entry.guestOf ?? null,
            entry.experienceLevel ?? null
        ]
    );

    return result.rows[0].id;
}

async function importRegistrationList(client, entries, status) {
    for (let position = 0; position < entries.length; position++) {
        const entry = entries[position];
        const isGuest = Boolean(entry.guestOf) || Boolean(entry.isGuest);

        const userId = await importUser(client, entry, { isGuest });

        // Reuse an existing registration for this user.
        const existing = await client.query(
            'SELECT id FROM registrations WHERE user_id = $1',
            [userId]
        );

        if (existing.rowCount > 0) {
            console.log(`Skipped existing registration for ${entry.email}`);
            continue;
        }

        await client.query(
            `INSERT INTO registrations (user_id, status, position)
             VALUES ($1, $2, $3)`,
            [userId, status, position]
        );
    }
}

async function migrate() {
    const usersData = await readJson(usersFilePath);
    const listsData = await readJson(listsFilePath);

    const users = Array.isArray(usersData.users) ? usersData.users : [];
    const registered = Array.isArray(listsData['registered-users'])
        ? listsData['registered-users']
        : [];
    const waitlisted = Array.isArray(listsData['waitlist-users'])
        ? listsData['waitlist-users']
        : [];
    const metadata = listsData['email-metadata'] || {};

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Import regular accounts first, including accounts not currently registered.
        for (const user of users) {
            await importUser(client, user);
        }

        // Preserve each list's order through its position values.
        await importRegistrationList(client, registered, 'registered');
        await importRegistrationList(client, waitlisted, 'waitlisted');

        // Import metadata as JSON values.
        for (const [key, value] of Object.entries(metadata)) {
            await client.query(
                `INSERT INTO email_metadata (key, value)
                 VALUES ($1, $2::jsonb)
                 ON CONFLICT (key) DO NOTHING`,
                [key, JSON.stringify(value)]
            );
        }

        await client.query('COMMIT');

        console.log('Migration completed.');
        console.log(`Account records read: ${users.length}`);
        console.log(`Registered entries read: ${registered.length}`);
        console.log(`Waitlisted entries read: ${waitlisted.length}`);
        console.log(`Metadata keys read: ${Object.keys(metadata).length}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

migrate()
    .catch(error => {
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
