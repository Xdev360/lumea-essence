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

// Path to subscribers data file
const SUBSCRIBERS_FILE = path.join(__dirname, 'data', 'subscribers.json');

// ========== UTILITY FUNCTIONS ==========

// Ensure data directory and file exist
async function ensureDataFile() {
    try {
        const dir = path.join(__dirname, 'data');
        await fs.mkdir(dir, { recursive: true });
        
        try {
            await fs.access(SUBSCRIBERS_FILE);
        } catch {
            await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Error creating data file:', error);
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
