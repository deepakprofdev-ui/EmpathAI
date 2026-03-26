/**
 * Builds the prompt for the Emotion Detection AI Service
 * @param {string} userText 
 * @returns {string} The formatted prompt string
 */
const buildEmotionPrompt = (userText) => {
  // Safe injection of user text, converting it to string and trimming
  const safeText = String(userText).trim();

  return `You are an emotion detection engine specialized in mental health support.
Analyze the emotional state of the user based on text.
Return JSON only.

Text:
${safeText}

Detect:
primary emotion (must be one of: happy, calm, neutral, sad, anxious, stressed, angry, overwhelmed, lonely, hopeful),
emotion intensity (1-10),
confidence score (0-1),
risk level (low, medium, high),
3 emotion tags (Array of strings),
recommended coping suggestion.

Do not include explanation text.
Output valid JSON only matching this schema:
{
  "emotion": "string",
  "intensity": number,
  "confidence": number,
  "risk_level": "string",
  "tags": ["string","string","string"],
  "recommended_action": "string"
}`;
};

module.exports = {
  buildEmotionPrompt
};
