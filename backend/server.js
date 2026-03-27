const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const emotionRoutes = require('./routes/emotionRoutes');
const rateLimit = require('express-rate-limit');
const logger = require('./logs/logger');
const db = require('../database/schema/db');
const firebase = require('./config/firebase');

const app = express();



app.use(cors());
app.use(express.json());

// Rate Limiter configuration: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Main App API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/emotion', emotionRoutes);



// Counselor APIs
app.get('/api/counselor', (req, res) => {
    res.json({ alerts: db.crisisAlerts, users: db.users });
});

// Mood Tracking APIs — Firebase persistent storage
app.post('/api/mood', async (req, res) => {
    const { userId, user_id, mood, note } = req.body;
    const uid = userId || user_id;
    if (!uid || !mood) return res.status(400).json({ error: 'Missing data' });
    const timestamp = Date.now();
    const entry = { userId: uid, mood, note: note || '', timestamp: new Date().toISOString() };
    try {
        await firebase.db.ref(`users/${uid}/moods/${timestamp}`).set(entry);
        res.json({ success: true, entry });
    } catch (err) {
        logger.error('Mood save failed: ' + err.message);
        // Fallback to in-memory so the UI still gets a success in dev
        db.moodEntries.push(entry);
        res.json({ success: true, entry });
    }
});

app.get('/api/dashboard/:userId', async (req, res) => {
    const userId = req.params.userId;

    // Pull moods from Firebase
    let moods = [];
    try {
        const moodSnap = await firebase.db.ref(`users/${userId}/moods`).once('value');
        if (moodSnap.exists()) moods = Object.values(moodSnap.val());
    } catch (err) {
        logger.error('Firebase mood fetch failed: ' + err.message);
        moods = db.moodEntries.filter(m => m.userId === userId); // fallback
    }

    const chats = db.chatHistory.filter(c => c.user_id === userId);

    // Pull emotions from Firebase
    let emotions = [];
    try {
        const snapshot = await firebase.db.ref(`users/${userId}/emotions`).once('value');
        if (snapshot.exists()) {
            emotions = Object.values(snapshot.val()).filter(e => e.risk_flag !== true);
        }
    } catch (err) {
        logger.error('Failed to pull from firebase: ' + err.message);
    }

    emotions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    moods.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ success: true, moods, chats, emotions });
});

// Serve Frontend Files — disable caching for JS/CSS so code changes reload instantly
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-store');
        }
    }
}));
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
