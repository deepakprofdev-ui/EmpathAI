const express = require('express');
const router = express.Router();
const db = require('../../database/schema/db.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { fastAnalyzeMessage } = require('../utils/fastEmotionFilter');
const firebase = require('../config/firebase');

router.post('/', async (req, res) => {
    const userId = req.body.userId || req.body.user_id;
    const message = req.body.message || '';
    if (!message) return res.json({ reply: "Hello! How are you feeling today?", emotion: 'neutral', isCrisis: false });

    // Utilize new Fast Static Keyword Heuristic
    const analysis = fastAnalyzeMessage(message);
    const isCrisis = analysis.isSensitive;
    const emotion = analysis.emotion;
    const timestamp = Date.now();
    
    // Store Emotion record in Firebase users/{userId}/emotions/{timestamp}
    if (firebase && firebase.db) {
        const emotionRef = firebase.db.ref(`users/${userId}/emotions/${timestamp}`);
        emotionRef.set({
            emotion: emotion,
            text: message,
            timestamp: timestamp,
            risk_flag: analysis.risk_flag || false
        }).catch(err => console.error("Firebase emotion logging failed:", err));
    }

    db.chatHistory.push({ user_id: userId, role: 'user', content: message, timestamp: new Date(timestamp).toISOString() });
    if (isCrisis) db.crisisAlerts.push({ userId, message, timestamp: new Date(timestamp).toISOString(), status: 'HIGH' });

    let aiReply = '';

    if (isCrisis) {
        aiReply = analysis.safe_reply;
    } else if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: `You are EmpathAI, an empathetic Healthcare AI Assistant designed to communicate like a warm, supportive human. Your goal is to help users feel heard, respected, and emotionally supported.

CORE BEHAVIOR:
- Speak in a warm, natural, human-like tone. Never sound robotic.
- Keep responses short, clear, and emotionally intelligent.
- Show empathy BEFORE giving any suggestions.
- Never claim to diagnose. Provide guidance, not prescriptions.
- Maintain user trust and emotional safety.

MANDATORY RESPONSE STRUCTURE (follow this every single time):
1. Acknowledge the user's message emotionally (1-2 lines)
2. Provide a supportive, human-like response (1-2 lines)
3. Suggest ONE small helpful action if appropriate (1 line)
4. End with the emotion classification on its own line

EMOTION CLASSIFICATION — always end your response with EXACTLY this format on a new line:
Emotion: [emoji] [label]

Use only one of these labels:
😊 Happy | 😢 Sad | 😐 Neutral | 😟 Anxiety | 😣 Stress | 😔 Lonely | 😡 Angry | 😴 Tired | 🤒 Sick | 🤯 Overwhelmed | 💪 Motivated

RESTRICTIONS — If a message contains abusive language, sexual content, hate speech, illegal topics, or spam, respond with:
"I'm here to support health and wellbeing conversations. I may not be able to respond to that request, but I'm happy to help if you'd like to talk about your health, feelings, stress, or wellbeing.

Emotion: 😐 Neutral"

CRISIS RULE — If a user expresses self-harm or extreme distress, respond with:
"I'm really sorry that you're feeling this much pain. You don't have to go through this alone. It might really help to talk to someone you trust or a mental health professional. If you're in immediate danger, please consider contacting local emergency services or a trusted person right now.

Emotion: 😟 Anxiety"

TONE: supportive, calm, respectful, non-judgmental, simple English, no jargon, no long paragraphs.
If emotion is unclear, default to: Emotion: 😐 Neutral`
            });
            const userHistory = db.chatHistory.filter(c => c.user_id === userId);
            const historySlice = userHistory.slice(-10);
            const currentMessage = historySlice.pop().content;
            const transcript = historySlice.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            const promptPayload = transcript ? `Here is the recent conversation transcript:\n${transcript}\n\nUSER: ${currentMessage}` : currentMessage;
            
            const chat = model.startChat({ history: [], generationConfig: { temperature: 0.75, maxOutputTokens: 350 } });
            const result = await chat.sendMessage(promptPayload);
            aiReply = result.response.text();
        } catch(err) { 
            console.error(err);
            aiReply = "I'm having trouble connecting right now, but I'm still here for you."; 
        }
    } else {
        aiReply = "I hear you. Tell me more.";
    }

    db.chatHistory.push({ user_id: userId, role: 'assistant', content: aiReply, timestamp: new Date().toISOString() });
    res.json({ reply: aiReply, emotion, isCrisis });
});

router.post('/:userId/counselor', (req, res) => {
    const userId = req.params.userId;
    const { message } = req.body;
    db.chatHistory.push({ user_id: userId, role: 'counselor', content: message, timestamp: new Date().toISOString() });
    res.json({ success: true, entry: { user_id: userId, role: 'counselor', content: message, timestamp: new Date().toISOString() } });
});

router.get('/:userId/history', (req, res) => {
    const history = db.chatHistory.filter(h => h.user_id === req.params.userId) || [];
    res.json({ success: true, history });
});

module.exports = router;
