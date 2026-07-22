// middleware.js
import { verifyToken } from './auth.js';
import { getRedis } from './db.js';
import config from './config.js';

// Authentication
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Rate limiting per user
export const rateLimitUser = (maxRequests = 100, windowMs = 60000) => {
  return async (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const key = `rate:${userId}`;
    const redis = getRedis();
    
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowMs / 1000);
    }
    
    if (current > maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    next();
  };
};

// Request logging
export const logger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

// Error handler
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Send error response
  res.status(status).json({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

// 404 handler
export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

// File upload middleware (using multer)
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/zip'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.limits.maxFileSize },
  fileFilter,
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message) 
      });
    }
    next();
  };
};

// CORS (though we handle in server)
export const corsOptions = {
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Cache middleware
export const cache = (duration = 60) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const redis = getRedis();
    
    const cached = await redis.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Store original send
    const originalSend = res.json;
    res.json = function(data) {
      redis.setex(key, duration, JSON.stringify(data));
      originalSend.call(this, data);
    };
    
    next();
  };
};
