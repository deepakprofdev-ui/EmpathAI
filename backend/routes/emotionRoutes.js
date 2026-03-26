const express = require('express');
const router = express.Router();

const { fastAnalyzeMessage } = require('../utils/fastEmotionFilter');
const authMiddleware = require('../middleware/authMiddleware');
const validateInput = require('../middleware/validateInput');

// POST /api/emotion/analyze
// Exposes the static keyword engine
router.post('/analyze', authMiddleware, validateInput, (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text input' });
    
    const analysis = fastAnalyzeMessage(text);
    return res.status(200).json({
        emotion: analysis.emotion,
        isSensitive: analysis.isSensitive,
        risk_flag: analysis.risk_flag || false,
        timestamp: Date.now()
    });
});

module.exports = router;
