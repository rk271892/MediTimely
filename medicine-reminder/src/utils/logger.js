const sensitiveFields = ['password', 'token', 'authorization'];

export const sanitizeData = (data) => {
  if (!data) return data;
  
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '[HIDDEN]';
    }
  });
  
  return sanitized;
};

export const safeLog = {
  info: (message, data) => {
    console.log(message, data ? sanitizeData(data) : '');
  },
  error: (message, error) => {
    console.error(message, sanitizeData(error));
  }
}; 