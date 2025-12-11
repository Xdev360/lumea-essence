// ========================================
// LUMEA ESSENCE - NEWSLETTER BACKEND
// Simple Express server for newsletter signups
// ========================================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin password (In production, use environment variables)
const ADMIN_PASSWORD = 'LumeaAdmin2025!';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Path to data files
const SUBSCRIBERS_FILE = path.join(__dirname, 'data', 'subscribers.json');
const GAME_SCORES_FILE = path.join(__dirname, 'data', 'game-scores.json');

// ========== UTILITY FUNCTIONS ==========

// Ensure data directory and files exist
async function ensureDataFile() {
    try {
        const dir = path.join(__dirname, 'data');
        await fs.mkdir(dir, { recursive: true });
        
        try {
            await fs.access(SUBSCRIBERS_FILE);
        } catch {
            await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify([], null, 2));
        }

        try {
            await fs.access(GAME_SCORES_FILE);
        } catch {
            await fs.writeFile(GAME_SCORES_FILE, JSON.stringify({ players: [], scores: [] }, null, 2));
        }
    } catch (error) {
        console.error('Error creating data file:', error);
    }
}

// Read/write helpers for game scores
async function readGameScores() {
    try {
        const data = await fs.readFile(GAME_SCORES_FILE, 'utf8');
        const parsed = JSON.parse(data);
        return {
            players: parsed.players || [],
            scores: parsed.scores || []
        };
    } catch (error) {
        console.error('Error reading game scores:', error);
        return { players: [], scores: [] };
    }
}

async function writeGameScores(payload) {
    try {
        await fs.writeFile(GAME_SCORES_FILE, JSON.stringify(payload, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing game scores:', error);
        return false;
    }
}

// Read subscribers from file
async function readSubscribers() {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading subscribers:', error);
        return [];
    }
}

// Write subscribers to file
async function writeSubscribers(subscribers) {
    try {
        await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing subscribers:', error);
        return false;
    }
}

// Validate Gmail address
function isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
}

// ========== API ENDPOINTS ==========

// POST: Subscribe to newsletter
app.post('/api/subscribe', async (req, res) => {
    try {
        const { name, email } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        if (!isValidGmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid Gmail address'
            });
        }

        // Read existing subscribers
        const subscribers = await readSubscribers();

        // Check if email already exists
        const emailExists = subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'This email is already subscribed'
            });
        }

        // Add new subscriber
        const newSubscriber = {
            id: Date.now(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            dateSubscribed: new Date().toISOString(),
            timestamp: Date.now()
        };

        subscribers.push(newSubscriber);

        // Save to file
        const saved = await writeSubscribers(subscribers);

        if (saved) {
            res.json({
                success: true,
                message: 'Thank you for subscribing!',
                subscriber: {
                    name: newSubscriber.name,
                    email: newSubscriber.email
                }
            });
        } else {
            throw new Error('Failed to save subscriber');
        }

    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// POST: Admin login verification
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            message: 'Access granted'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid password'
        });
    }
});

// GET: Get all subscribers (admin only)
app.get('/api/admin/subscribers', async (req, res) => {
    try {
        const { auth } = req.headers;

        // Simple authentication check
        if (auth !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const subscribers = await readSubscribers();

        res.json({
            success: true,
            count: subscribers.length,
            subscribers: subscribers
        });

    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET: Export subscribers as CSV (admin only)
app.get('/api/admin/export-csv', async (req, res) => {
    try {
        const { auth } = req.headers;

        if (auth !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const subscribers = await readSubscribers();

        // Create CSV content
        let csv = 'Name,Email,Date Subscribed\n';
        subscribers.forEach(sub => {
            const date = new Date(sub.dateSubscribed).toLocaleString();
            csv += `"${sub.name}","${sub.email}","${date}"\n`;
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=lumea-subscribers.csv');
        res.send(csv);

    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// DELETE: Remove subscriber (admin only)
app.delete('/api/admin/subscriber/:id', async (req, res) => {
    try {
        const { auth } = req.headers;
        const { id } = req.params;

        if (auth !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const subscribers = await readSubscribers();
        const filteredSubscribers = subscribers.filter(sub => sub.id !== parseInt(id));

        if (filteredSubscribers.length === subscribers.length) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        await writeSubscribers(filteredSubscribers);

        res.json({
            success: true,
            message: 'Subscriber removed'
        });

    } catch (error) {
        console.error('Delete subscriber error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== GAME ENDPOINTS ==========

// POST: Register a game player (TikTok username + email)
app.post('/api/game/register-player', async (req, res) => {
    try {
        const { tikTokUsername, email } = req.body;

        if (!tikTokUsername || !email) {
            return res.status(400).json({ success: false, message: 'Username and email are required' });
        }

        const data = await readGameScores();

        // Ensure unique by TikTok username (case-insensitive)
        const existingIndex = data.players.findIndex(p => p.tikTokUsername.toLowerCase() === tikTokUsername.toLowerCase());

        if (existingIndex >= 0) {
            // Update email if changed
            data.players[existingIndex].email = email;
        } else {
            data.players.push({
                id: Date.now(),
                tikTokUsername: tikTokUsername.trim(),
                email: email.trim(),
                createdAt: new Date().toISOString()
            });
        }

        await writeGameScores(data);

        res.json({
            success: true,
            playerId: data.players.find(p => p.tikTokUsername.toLowerCase() === tikTokUsername.toLowerCase()).id
        });
    } catch (error) {
        console.error('Register player error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST: Submit a game score (keeps highest per user)
app.post('/api/game/submit-score', async (req, res) => {
    try {
        const { tikTokUsername, score } = req.body;

        if (!tikTokUsername || typeof score !== 'number') {
            return res.status(400).json({ success: false, message: 'Username and score are required' });
        }

        const data = await readGameScores();
        const username = tikTokUsername.trim();
        const now = new Date().toISOString();

        // Ensure player exists
        let player = data.players.find(p => p.tikTokUsername.toLowerCase() === username.toLowerCase());
        if (!player) {
            player = {
                id: Date.now(),
                tikTokUsername: username,
                email: '',
                createdAt: now
            };
            data.players.push(player);
        }

        // Upsert score keeping the highest
        const existingIdx = data.scores.findIndex(s => s.tikTokUsername.toLowerCase() === username.toLowerCase());
        if (existingIdx >= 0) {
            if (score > data.scores[existingIdx].score) {
                data.scores[existingIdx].score = score;
                data.scores[existingIdx].timestamp = now;
            }
        } else {
            data.scores.push({
                tikTokUsername: username,
                score,
                timestamp: now
            });
        }

        await writeGameScores(data);

        res.json({ success: true });
    } catch (error) {
        console.error('Submit score error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET: Leaderboard (top 20)
app.get('/api/game/leaderboard', async (_req, res) => {
    try {
        const data = await readGameScores();
        const leaderboard = (data.scores || [])
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ========== START SERVER ==========

async function startServer() {
    await ensureDataFile();
    
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║   LUMEA ESSENCE NEWSLETTER SERVER     ║
║   Server running on port ${PORT}        ║
╚════════════════════════════════════════╝

Admin Panel: http://localhost:${PORT}/admin-newsletter.html
Admin Password: ${ADMIN_PASSWORD}

API Endpoints:
- POST /api/subscribe
- POST /api/admin/verify
- GET  /api/admin/subscribers
- GET  /api/admin/export-csv
- DELETE /api/admin/subscriber/:id
        `);
    });
}

startServer();
