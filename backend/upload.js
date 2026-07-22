// uploads.js
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from './config.js';

// Memory storage for S3 uploads
const memoryStorage = multer.memoryStorage();

// Disk storage for local development
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/zip',
    'application/x-zip-compressed',
    'application/javascript',
    'text/javascript',
    'text/css',
    'text/html',
    'application/json',
    'text/plain',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Create multer instance
export const upload = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : diskStorage,
  limits: {
    fileSize: config.limits.maxFileSize,
  },
  fileFilter,
});

// Handle multiple files
export const uploadMultiple = upload.array('files', 10);

// Handle single file
export const uploadSingle = upload.single('file');

// Upload to storage service
export const processUpload = async (file, userId, directory = 'uploads') => {
  // Implementation using storage service
};
