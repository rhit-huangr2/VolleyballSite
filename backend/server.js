import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import schedule from "node-schedule";

// Resolve paths relative to this file (works regardless of where node was started)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(__dirname, "registrations.json");
const MAX_PLAYERS = 24;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(PROJECT_ROOT, 'public')));

// Utility: read JSON safely
function readRegistrations() {
    if (!fs.existsSync(DATA_FILE)) return { registered: [], waitlist: [] };
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    let data;
    try {
        data = JSON.parse(raw || "{}");
    } catch (e) {
        // If the file is malformed, return empty structure
        return { registered: [], waitlist: [] };
    }

    return {
        registered: Array.isArray(data.registered) ? data.registered : [],
        waitlist: Array.isArray(data.waitlist) ? data.waitlist : []
    };
}

// Utility: write JSON safely
function writeRegistrations(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/register", (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required." });
    }

    const registrations = readRegistrations();

    // Prevent duplicates but still return the other attendees when the email is already registered
    const isRegistered = registrations.registered.some(r => r.email === email);
    const isWaitlisted = registrations.waitlist.some(r => r.email === email);

    if (isRegistered || isWaitlisted) {
        const registeredOthers = registrations.registered
            .map(({ name, email }) => ({ name, email }));

        const waitlistedOthers = registrations.waitlist
            .map(({ name, email }) => ({ name, email }));

        return res.status(409).json({ message: "This email is already registered.", registered: registeredOthers, waitlisted: waitlistedOthers });
    }

    // Limit players
    if (registrations.registered.length >= MAX_PLAYERS) {
        registrations.waitlist.push({
            name,
            email,
        });
        writeRegistrations(registrations);

        return res.status(403).json({ message: "Player Limit Reached. You will be added to the waitlist." });
    }

    registrations.registered.push({
        name,
        email,
        registeredAt: new Date().toISOString()
    });

    writeRegistrations(registrations);

    // Return success plus the other registered users and waitlisted users (exclude the newly registered one)
    const registeredOthers = registrations.registered
        .map(({ name, email }) => ({ name, email }));

    const waitlistedOthers = registrations.waitlist
        .map(({ name, email }) => ({ name, email }));

    res.json({ message: "You are registered successfully!", registered: registeredOthers, waitlisted: waitlistedOthers });
    
});

// Health / root endpoint
app.get("/", (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, "index.html"));
});

app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
});

// Schedule a job to clear the registrations.json file every Tuesday at 12 am
schedule.scheduleJob("0 0 * * 2", () => {
    console.log("Clearing registrations.json file...");
    writeRegistrations({ registered: [], waitlist: [] });
    console.log("registrations.json file cleared.");
});

