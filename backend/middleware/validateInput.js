const logger = require('../logs/logger');

const validateInput = (req, res, next) => {
  const { user_id, text } = req.body;

  if (!user_id || typeof user_id !== 'string') {
    logger.warn('Validation failed: Missing or invalid user_id');
    return res.status(400).json({ error: 'Invalid or missing user_id' });
  }

  if (!text || typeof text !== 'string') {
    logger.warn('Validation failed: Missing or invalid text');
    return res.status(400).json({ error: 'Invalid or missing text' });
  }

  if (text.trim().length === 0) {
    logger.warn('Validation failed: Empty text');
    return res.status(400).json({ error: 'Text cannot be empty' });
  }

  if (text.length > 2000) {
    logger.warn('Validation failed: Text over 2000 characters');
    return res.status(400).json({ error: 'Text exceeds 2000 characters limit' });
  }

  // Basic sanitization
  req.body.text = text.trim();

  next();
};

module.exports = validateInput;
