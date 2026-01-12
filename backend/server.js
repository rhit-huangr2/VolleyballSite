import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());



const DATA_FILE = path.join(process.cwd(), "backend/registrations.json");
const MAX_PLAYERS = 24;

// Utility: read JSON safely
function readRegistrations() {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw || "[]");
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
    if (registrations.some(r => r.email === email)) {
        const others = registrations
            // .filter(r => r.email !== email)
            .map(({ name, email }) => ({ name, email }));

        return res.status(409).json({ message: "This email is already registered.", others });
    }

    // Limit players
    if (registrations.length >= MAX_PLAYERS) {
        return res.status(403).json({ message: "Event is full." });
    }

    registrations.push({
        name,
        email,
        registeredAt: new Date().toISOString()
    });

    writeRegistrations(registrations);

    // Return success plus the other registered users (exclude the newly registered one)
    const others = registrations
        // .filter(r => r.email !== email)
        .map(({ name, email }) => ({ name, email }));

    res.json({ message: "You are registered successfully!", others });
    console.log(others);
});

// Health / root endpoint
app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "index.html"));
});

app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
});
