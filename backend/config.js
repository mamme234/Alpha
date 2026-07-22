// config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',
  refreshTokenExpiresIn: '30d',

  // Databases
  postgres: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  mongodb: process.env.MONGODB_URI,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },

  // Storage
  s3: {
    accessKey: process.env.AWS_ACCESS_KEY,
    secretKey: process.env.AWS_SECRET_KEY,
    bucket: process.env.AWS_BUCKET,
    region: process.env.AWS_REGION,
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  // Deployment
  deployment: {
    baseDomain: process.env.BASE_DOMAIN || 'app-name.dev',
    buildTimeout: 600000, // 10 minutes
    maxDeployments: 50,
  },

  // Limits
  limits: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxProjectsPerUser: 100,
    maxTeamMembers: 50,
    maxAppsPerDeveloper: 50,
  },

  // Features
  features: {
    enableMonetization: process.env.ENABLE_MONETIZATION === 'true',
    enableDocker: process.env.ENABLE_DOCKER === 'true',
    enableTeam: process.env.ENABLE_TEAM === 'true',
  },
};
