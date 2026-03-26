const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/schema/db.js');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'empathai_secret_key_2026';

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let user = db.users.find(u => u.email === email);
    
    // Explicit counselor backdoor mapping check
    if (!user && email === 'counselor@empathai.app') {
        user = db.users.find(u => u.login_type === 'counselor');
    }

    if (!user || user.password_hash === null) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.user_id, role: user.login_type }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { user_id: user.user_id, email: user.email, name: user.name, login_type: user.login_type }});
});

router.post('/register', async (req, res) => {
    const { email, password, name, voice_sample } = req.body;
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const newUser = {
        user_id: 'USR' + Math.floor(Math.random() * 10000),
        name: name || 'User',
        email,
        password_hash: hash,
        login_type: 'email',
        voice_sample: voice_sample || null,
        created_at: Date.now()
    };
    db.users.push(newUser);
    const token = jwt.sign({ id: newUser.user_id, role: newUser.login_type }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { user_id: newUser.user_id, email, name, login_type: 'email' } });
});

router.post('/anonymous', (req, res) => {
    const newUser = {
        user_id: 'ANON' + Math.floor(Math.random() * 10000),
        name: 'Guest',
        email: null,
        password_hash: null,
        login_type: 'anonymous',
        voice_enabled: req.body.voice_enabled !== false,
        created_at: Date.now()
    };
    db.users.push(newUser);
    const token = jwt.sign({ id: newUser.user_id, role: 'anonymous' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: newUser });
});

router.post('/google', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'No token provided' });
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = db.users.find(u => u.email === email);
        if (!user) {
            user = {
                user_id: 'GOOG' + Math.floor(Math.random() * 10000),
                name: name || 'Google User',
                email,
                avatar: picture,
                password_hash: null,
                login_type: 'google',
                created_at: Date.now()
            };
            db.users.push(user);
        }

        const appToken = jwt.sign({ id: user.user_id, role: user.login_type }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token: appToken, user: { user_id: user.user_id, email: user.email, name: user.name, login_type: user.login_type }});
    } catch (error) {
        console.error('Google verification error:', error);
        res.status(400).json({ success: false, message: 'Invalid Google login' });
    }
});

module.exports = router;
