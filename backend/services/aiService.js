const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../logs/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_api_key_to_prevent_startup_crash', 
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_gemini_key');

/**
 * Call AI API with 2 retries and timeout handling
 * @param {string} promptText 
 * @param {number} retries 
 */
const callAI = async (promptText, retries = 2) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      // Setup timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }, { signal: controller.signal });

      clearTimeout(timeoutId);
      
      const content = response.choices[0].message.content;
      return JSON.parse(content);
      
    } catch (error) {
      logger.warn(`OpenAI attempt ${attempt} failed: ${error.message}`);
      if (attempt > retries) {
        logger.error('OpenAI failed after retries, attempting Gemini fallback');
        return callGeminiFallback(promptText);
      }
    }
  }
};

/**
 * Fallback to Gemini AI if OpenAI fails
 */
const callGeminiFallback = async (promptText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(promptText);
    const text = result.response.text();
    // Strip markdown formatting if Gemini added it
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    logger.error(`Gemini fallback also failed: ${err.message}`);
    throw new Error('All AI services failed');
  }
};

module.exports = {
  callAI
};
