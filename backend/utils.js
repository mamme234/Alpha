// utils.js
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure token
export const generateSecureToken = () => {
  return crypto.randomBytes(64).toString('base64');
};

// Hash string
export const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Slug generator
export const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

// Extract file extension
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Check if file is image
export const isImage = (mimetype) => {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimetype);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Parse pagination
export const parsePagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Build search query
export const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm) return {};
  return {
    $or: fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

// Parse filters
export const parseFilters = (filters) => {
  const filterObj = {};
  if (filters.category) filterObj.category = filters.category;
  if (filters.price) filterObj.isFree = filters.price === 'free';
  if (filters.platform) filterObj.platforms = filters.platform;
  if (filters.tags) filterObj.tags = { $in: filters.tags.split(',') };
  return filterObj;
};

// Get time range
export const getTimeRange = (range = '7d') => {
  const now = new Date();
  const ranges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  };
  const ms = ranges[range] || ranges['7d'];
  return {
    start: new Date(now.getTime() - ms),
    end: now,
  };
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Extract domain from URL
export const extractDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
};

// Mask sensitive data
export const maskSensitiveData = (data) => {
  const masked = { ...data };
  if (masked.password) masked.password = '********';
  if (masked.token) masked.token = '********';
  if (masked.secret) masked.secret = '********';
  if (masked.apiKey) masked.apiKey = '********';
  return masked;
};

// Delay function
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await delay(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

// Convert to camelCase
export const toCamelCase = (str) => {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

// Convert to snake_case
export const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
};

// Deep clone
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export default {
  generateRandomString,
  generateSecureToken,
  hashString,
  generateSlug,
  getFileExtension,
  isImage,
  formatFileSize,
  parsePagination,
  buildSearchQuery,
  parseFilters,
  getTimeRange,
  isValidUrl,
  extractDomain,
  maskSensitiveData,
  delay,
  retry,
  toCamelCase,
  toSnakeCase,
  deepClone,
};
