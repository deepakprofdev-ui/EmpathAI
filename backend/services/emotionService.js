const aiService = require('./aiService');
const { buildEmotionPrompt } = require('../utils/emotionPromptBuilder');
const { calculateRiskLevel } = require('../utils/riskDetection');
const logger = require('../logs/logger');

/**
 * Process emotion detection
 * @param {string} userText 
 * @returns {object} Final emotion JSON
 */
const analyzeText = async (userText) => {
  const prompt = buildEmotionPrompt(userText);

  try {
    // Call AI
    const rawAiResult = await aiService.callAI(prompt);
    
    // Safety check fields
    const emotion = rawAiResult.emotion || 'neutral';
    const intensity = typeof rawAiResult.intensity === 'number' ? rawAiResult.intensity : 5;
    const confidence = typeof rawAiResult.confidence === 'number' ? rawAiResult.confidence : 0.5;
    const tags = Array.isArray(rawAiResult.tags) ? rawAiResult.tags : [];
    const recommendedAction = rawAiResult.recommended_action || 'Take a deep breath and clear your mind.';
    const aiRisk = rawAiResult.risk_level || 'low';

    // Apply risk detection logic override
    const finalRiskLevel = calculateRiskLevel(userText, emotion, intensity, aiRisk);

    // Construct standard response
    const finalResponse = {
      emotion: emotion.toLowerCase(),
      confidence: confidence,
      intensity: intensity,
      tags: tags,
      risk_level: finalRiskLevel,
      recommended_action: recommendedAction,
      timestamp: Date.now()
    };

    return finalResponse;

  } catch (error) {
    logger.error('Emotion Service error: ' + error.message);
    
    // Fail gracefully: fallback emotion
    return {
      emotion: 'neutral',
      confidence: 0.1,
      intensity: 1,
      tags: ['error', 'fallback'],
      risk_level: 'low',
      recommended_action: 'Please try again later.',
      timestamp: Date.now()
    };
  }
};

module.exports = {
  analyzeText
};
