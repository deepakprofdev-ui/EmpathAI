const { analyzeText } = require('../services/emotionService');
const { saveEmotion } = require('../config/firebase');
const logger = require('../logs/logger');

const analyzeEmotion = async (req, res) => {
  try {
    const { user_id, text } = req.body;

    logger.logApiCall('POST', '/api/emotion/analyze', 'PROCESSING');

    // 1. Process text through AI services
    const aiResponse = await analyzeText(text);

    // 2. Add user_id to response for complete tracking 
    const fullEmotionData = {
      ...aiResponse,
      user_id
    };

    // 3. Store result in Firebase Database
    await saveEmotion(user_id, fullEmotionData);

    logger.logInfo(`Successfully analyzed emotion for user: ${user_id}`);
    
    // 4. Return structured JSON
    return res.status(200).json(fullEmotionData);

  } catch (error) {
    logger.logError('Error in emotionController.analyzeEmotion', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  analyzeEmotion
};
