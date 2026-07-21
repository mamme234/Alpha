const jwt = require('jsonwebtoken');
const User = require('./db').User;
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// ============================================
// AUTH MIDDLEWARE
// ============================================

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// ============================================
// RATE LIMITING
// ============================================

exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

exports.strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later.'
});

// ============================================
// ERROR HANDLER
// ============================================

exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
};

// ============================================
// UPLOAD MIDDLEWARE
// ============================================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/javascript',
    'text/javascript',
    'application/json',
    'text/plain',
    'text/html',
    'text/css',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream'
  ];
  
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.js') || file.originalname.endsWith('.json')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: fileFilter
});
