// config.js
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:5000/api',
  wsUrl: process.env.WS_URL || 'ws://localhost:5000',
  appName: 'Developer Platform',
  version: '1.0.0',
  
  // Feature flags
  features: {
    enableMonetization: true,
    enableDocker: true,
    enableTeams: true,
    enableWebSockets: true,
  },
  
  // Limits
  limits: {
    maxFileSize: 100 * 1024 * 1024,
    maxImageSize: 5 * 1024 * 1024,
  },
};

export default config;
