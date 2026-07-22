// logs.js
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'platform-api' },
  transports: [
    // Write to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write to file - errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // Write to file - all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// Audit log
export const auditLog = (action, userId, metadata = {}) => {
  logger.info('AUDIT', {
    action,
    userId,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

// Security events
export const securityLog = (event, userId, details = {}) => {
  logger.warn('SECURITY', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
