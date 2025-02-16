import winston from 'winston';
import { format } from 'winston';
const { combine, timestamp, printf, colorize } = format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if exists
  if (Object.keys(metadata).length > 0) {
    // Mask sensitive data
    if (metadata.password) metadata.password = '********';
    if (metadata.token) metadata.token = '********';
    if (metadata.email) metadata.email = metadata.email.replace(/(?<=.{3}).(?=.*@)/g, '*');
    
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger
const logger = winston.createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console logging
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
      level: 'debug'
    }),
    // Error logging
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined logging
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

export default logger; 