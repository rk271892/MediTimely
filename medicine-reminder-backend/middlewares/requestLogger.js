import morgan from 'morgan';
import logger from '../utils/logger.js';

// Create custom morgan token for request body
morgan.token('body', (req) => {
  const body = { ...req.body };
  
  // Mask sensitive data
  if (body.password) body.password = '********';
  if (body.token) body.token = '********';
  if (body.email) body.email = body.email.replace(/(?<=.{3}).(?=.*@)/g, '*');
  
  return JSON.stringify(body);
});

// Create request logger
export const requestLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :body',
  {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }
); 