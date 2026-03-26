const express = require('express');
const router = express.Router();
const { spawnSync } = require('child_process');
const path = require('path');

router.post('/detect', (req, res) => {
    const message = req.body.text || req.body.message || '';
    if (!message) return res.json({ success: false, emotion: 'neutral', error: 'No text provided' });
    
    try {
        const pythonScript = path.join(__dirname, '../../ai/sentiment_model.py');
        const result = spawnSync('python', [pythonScript, message], { encoding: 'utf-8' });
        
        if (result.error) throw result.error;
        
        const output = JSON.parse(result.stdout.trim());
        res.json({ success: true, emotion: output.emotion, confidence: output.confidence });
    } catch (err) {
        console.error('Python Emotion Model Error:', err.message);
        res.json({ success: false, emotion: 'neutral', error: err.message });
    }
});

module.exports = router;
