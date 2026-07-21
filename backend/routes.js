const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import controllers
const {
  // Auth
  register, login, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword,
  // Projects
  getProjects, getProject, createProject, updateProject, deleteProject, uploadCode, connectGitHub, getCode, updateCode, deleteCode, getFiles,
  // Deployments
  deploy, getDeployments, getDeployment, getLogs, rollback, getStatus, cancelDeployment,
  // Apps
  getApps, searchApps, getFeatured, getTrending, getNewApps, getByCategory, getApp, downloadApp, toggleFavorite, addReview, getReviews, updateReview, deleteReview,
  // Analytics
  getProjectAnalytics, getRealtimeAnalytics, getDownloads, getActiveUsers, getRevenue, getCrashes, getPerformance
} = require('./controllers');

// Import middleware
const { protect } = require('./middleware');

// ============================================
// AUTH ROUTES
// ============================================

const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['USER', 'DEVELOPER', 'ADMIN'])
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/auth/register', registerValidation, register);
router.post('/auth/login', loginValidation, login);
router.post('/auth/logout', protect, logout);
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.post('/auth/change-password', protect, changePassword);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ============================================
// PROJECT ROUTES
// ============================================

const createProjectValidation = [
  body('name').isLength({ min: 3 }).withMessage('Project name must be at least 3 characters'),
  body('framework').isIn(['REACT', 'NEXT', 'VUE', 'NODE', 'STATIC', 'OTHER']),
  body('language').isIn(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'GO', 'OTHER'])
];

router.get('/projects', protect, getProjects);
router.get('/projects/:id', protect, getProject);
router.post('/projects', protect, createProjectValidation, createProject);
router.put('/projects/:id', protect, updateProject);
router.delete('/projects/:id', protect, deleteProject);
router.post('/projects/:id/upload', protect, uploadCode);
router.post('/projects/:id/github', protect, connectGitHub);
router.get('/projects/:id/code', protect, getCode);
router.put('/projects/:id/code', protect, updateCode);
router.delete('/projects/:id/code', protect, deleteCode);
router.get('/projects/:id/files', protect, getFiles);

// ============================================
// DEPLOYMENT ROUTES
// ============================================

router.post('/deployments/project/:projectId', protect, deploy);
router.get('/deployments/project/:projectId', protect, getDeployments);
router.get('/deployments/:id', protect, getDeployment);
router.get('/deployments/:id/logs', protect, getLogs);
router.post('/deployments/:id/rollback', protect, rollback);
router.get('/deployments/:id/status', protect, getStatus);
router.post('/deployments/:id/cancel', protect, cancelDeployment);

// ============================================
// APP ROUTES
// ============================================

router.get('/apps', getApps);
router.get('/apps/search', searchApps);
router.get('/apps/featured', getFeatured);
router.get('/apps/trending', getTrending);
router.get('/apps/new', getNewApps);
router.get('/apps/category/:category', getByCategory);
router.get('/apps/:id', getApp);
router.post('/apps/:id/download', protect, downloadApp);
router.post('/apps/:id/favorite', protect, toggleFavorite);
router.post('/apps/:id/review', protect, addReview);
router.get('/apps/:id/reviews', getReviews);
router.put('/apps/reviews/:reviewId', protect, updateReview);
router.delete('/apps/reviews/:reviewId', protect, deleteReview);

// ============================================
// ANALYTICS ROUTES
// ============================================

router.get('/analytics/project/:projectId', protect, getProjectAnalytics);
router.get('/analytics/project/:projectId/realtime', protect, getRealtimeAnalytics);
router.get('/analytics/project/:projectId/downloads', protect, getDownloads);
router.get('/analytics/project/:projectId/users', protect, getActiveUsers);
router.get('/analytics/project/:projectId/revenue', protect, getRevenue);
router.get('/analytics/project/:projectId/crashes', protect, getCrashes);
router.get('/analytics/project/:projectId/performance', protect, getPerformance);

module.exports = router;
