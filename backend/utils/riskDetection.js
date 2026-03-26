/**
 * Scans text for crisis keywords and overrides AI risk if necessary.
 * 
 * Logic Provided by Master Prompt:
 * Medium Risk:
 * if emotion in: sad, lonely, overwhelmed, hopeless
 * AND intensity > 7 -> risk_level = medium
 * 
 * High Risk Keywords:
 * suicide, kill myself, end my life, hurt myself, no reason to live, want to die
 * -> risk_level = high
 * 
 * @param {string} text - User's chat context/text
 * @param {string} aiEmotion - Emotion identified by AI
 * @param {number} intensity - Emotion intensity (1-10)
 * @param {string} aiRisk - Risk level provided by AI
 * @returns {string} Calculated risk level ('low', 'medium', 'high')
 */
const calculateRiskLevel = (text, aiEmotion, intensity, aiRisk) => {
  const lowerText = text.toLowerCase();
  
  // High Risk Keywords Check
  const highRiskKeywords = [
    'suicide',
    'kill myself',
    'end my life',
    'hurt myself',
    'no reason to live',
    'want to die'
  ];

  for (const keyword of highRiskKeywords) {
    if (lowerText.includes(keyword)) {
      return 'high';
    }
  }

  // Medium Risk Logic
  const mediumRiskEmotions = ['sad', 'lonely', 'overwhelmed', 'hopeless'];
  if (mediumRiskEmotions.includes(aiEmotion.toLowerCase()) && intensity > 7) {
    // If AI already said high, we trust the high or manual high check
    if (aiRisk === 'high') return 'high';
    return 'medium';
  }

  // Fallback to AI's determined risk or 'low'
  if (['low', 'medium', 'high'].includes(aiRisk && aiRisk.toLowerCase())) {
    return aiRisk.toLowerCase();
  }
  
  return 'low';
};

module.exports = {
  calculateRiskLevel
};
