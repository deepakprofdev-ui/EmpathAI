const admin = require('firebase-admin');
const path = require('path');
const logger = require('../logs/logger');

// Initialize Firebase Admin (assuming serviceAccountKey.json is placed in backend folder or loaded from env)
// For now, we will try to load from an env variable FIREBASE_SERVICE_ACCOUNT or a local file.
// If neither exists, we'll initialize without credentials (will fail if actually communicating, but safe for mockup).
try {
  let certOptions = undefined;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    certOptions = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    try {
      certOptions = require(path.join(__dirname, '../serviceAccountKey.json'));
    } catch (err) {
      logger.warn('No serviceAccountKey.json found, skipping explicit cert injection');
    }
  }

  admin.initializeApp({
    credential: certOptions ? admin.credential.cert(certOptions) : admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://empath-ai-default-rtdb.firebaseio.com' 
  });
  logger.info("Firebase Admin initialized successfully.");
} catch (error) {
  logger.error("Error initializing Firebase Admin: " + error.message);
}

const db = admin.database();

/**
 * Save an emotion detection event to Firebase
 */
const saveEmotion = async (userId, emotionData) => {
  try {
    const timestamp = emotionData.timestamp || Date.now();
    const emotionRef = db.ref(`emotions/${userId}`).push();
    await emotionRef.set({
      emotion_id: emotionRef.key,
      emotion: emotionData.emotion,
      intensity: emotionData.intensity,
      confidence: emotionData.confidence,
      tags: emotionData.tags,
      risk_level: emotionData.risk_level,
      recommended_action: emotionData.recommended_action,
      timestamp: timestamp
    });
    return emotionRef.key;
  } catch (error) {
    logger.error('Error saving emotion: ' + error.message);
    throw error;
  }
};

/**
 * Save daily mood log summary
 */
const saveMoodLog = async (userId, dateStr, dominantEmotion, avgIntensity) => {
  try {
    const moodRef = db.ref(`mood_logs/${userId}/${dateStr}`);
    await moodRef.set({
      dominant_emotion: dominantEmotion,
      avg_intensity: avgIntensity
    });
  } catch (error) {
    logger.error('Error saving mood log: ' + error.message);
    throw error;
  }
};

/**
 * Update the long term weekly/monthly summary
 */
const updateEmotionSummary = async (userId, summaryData) => {
  try {
    const summaryRef = db.ref(`emotion_summary/${userId}`);
    await summaryRef.update({
      weekly_summary: summaryData.weekly_summary || null,
      monthly_summary: summaryData.monthly_summary || null
    });
  } catch (error) {
    logger.error('Error updating emotion summary: ' + error.message);
    throw error;
  }
};

module.exports = {
  admin,
  db,
  saveEmotion,
  saveMoodLog,
  updateEmotionSummary
};
