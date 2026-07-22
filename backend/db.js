// db.js
import mongoose from 'mongoose';
import { Pool } from 'pg';
import Redis from 'ioredis';
import config from './config.js';

let pgPool = null;
let redisClient = null;

export const connectDB = async () => {
  try {
    // MongoDB for app metadata, reviews, analytics
    await mongoose.connect(config.mongodb, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // PostgreSQL for users, auth, billing, relationships
    pgPool = new Pool(config.postgres);
    await pgPool.connect();
    console.log('✅ PostgreSQL connected');

    // Redis for caching, sessions, real-time
    redisClient = new Redis(config.redis);
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    
    // Initialize tables
    await initPostgresTables();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const initPostgresTables = async () => {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      is_verified BOOLEAN DEFAULT false,
      is_developer BOOLEAN DEFAULT false,
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret TEXT,
      avatar_url TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      owner_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS team_members (
      team_id INTEGER REFERENCES teams(id),
      user_id INTEGER REFERENCES users(id),
      role VARCHAR(50) DEFAULT 'developer',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (team_id, user_id)
    );
    
    -- Add more tables as needed
  `);
  console.log('✅ PostgreSQL tables initialized');
};

export const getPgPool = () => pgPool;
export const getRedis = () => redisClient;
export const closeDB = async () => {
  await mongoose.disconnect();
  await pgPool?.end();
  await redisClient?.quit();
};
