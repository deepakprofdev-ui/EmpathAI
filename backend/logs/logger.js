const winston = require('winston');

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Helper functions as requested
logger.logInfo = (message) => logger.info(message);
logger.logError = (message, error = null) => {
  const errMsg = error ? `${message} - ${error.message || error}` : message;
  logger.error(errMsg);
};
logger.logApiCall = (method, url, status) => {
  logger.info(`API CALL: ${method} ${url} [STATUS: ${status}]`);
};

module.exports = logger;
