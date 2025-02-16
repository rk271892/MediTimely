import logger from './logger.js';

export const monitoringStats = {
  startTime: new Date(),
  requests: 0,
  errors: 0,
  notifications: {
    sent: 0,
    failed: 0
  }
};

export const incrementStat = (stat) => {
  if (stat.includes('.')) {
    const [category, metric] = stat.split('.');
    monitoringStats[category][metric]++;
  } else {
    monitoringStats[stat]++;
  }
};

// Log stats every hour
setInterval(() => {
  const uptime = (new Date() - monitoringStats.startTime) / 1000 / 60 / 60;
  
  logger.info('System Stats', {
    uptime: `${uptime.toFixed(2)} hours`,
    ...monitoringStats,
    requestsPerHour: (monitoringStats.requests / uptime).toFixed(2),
    errorRate: ((monitoringStats.errors / monitoringStats.requests) * 100).toFixed(2) + '%',
    notificationSuccessRate: ((monitoringStats.notifications.sent / (monitoringStats.notifications.sent + monitoringStats.notifications.failed)) * 100).toFixed(2) + '%'
  });
}, 3600000); // Every hour 