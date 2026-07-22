// routes.js
import express from 'express';
import { 
  authController, 
  userController, 
  developerController, 
  adminController 
} from './controllers.js';
import { authenticate, authorize, upload, validate, rateLimitUser } from './middleware.js';
import { validateSchema } from './validator.js';

const router = express.Router();

// ==================== Public Routes ====================
// Auth
router.post('/auth/register', validate(validateSchema.register), authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authenticate, authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/verify-email', authController.verifyEmail);
router.post('/auth/request-password-reset', authController.requestPasswordReset);
router.post('/auth/reset-password', authController.resetPassword);

// Public app browsing
router.get('/apps', userController.searchApps);
router.get('/apps/:appId', userController.getAppDetails);
router.get('/categories', userController.getCategories);

// ==================== User Routes (Protected) ====================
router.use('/users', authenticate, rateLimitUser(200, 60000));
router.get('/users/dashboard', userController.getDashboard);
router.get('/users/favorites', userController.getFavorites);
router.get('/users/downloads', userController.getDownloadHistory);
router.post('/users/apps/:appId/download', userController.downloadApp);
router.post('/users/apps/:appId/favorite', userController.favoriteApp);
router.post('/users/apps/:appId/reviews', userController.writeReview);
router.get('/users/apps/:appId/reviews', userController.getReviews);
router.get('/users/notifications', userController.getNotifications);
router.put('/users/notifications/:notificationId', userController.markNotificationRead);

// ==================== Developer Routes (Protected) ====================
router.use('/developers', authenticate, authorize('developer', 'admin'), rateLimitUser(300, 60000));

// Projects
router.get('/developers/dashboard', developerController.getDashboard);
router.post('/developers/projects', developerController.createProject);
router.get('/developers/projects/:projectId', developerController.getProject);
router.put('/developers/projects/:projectId', developerController.updateProject);
router.delete('/developers/projects/:projectId', developerController.deleteProject);
router.get('/developers/projects/:projectId/files', developerController.getProjectFiles);
router.post('/developers/projects/:projectId/files', developerController.saveProjectFile);

// Deployments
router.post('/developers/projects/:projectId/deploy', developerController.deployProject);
router.get('/developers/deployments/:deploymentId', developerController.getDeploymentStatus);
router.get('/developers/deployments/:deploymentId/logs', developerController.getDeploymentLogs);
router.post('/developers/deployments/:deploymentId/rollback', developerController.rollbackDeployment);

// Publishing
router.post('/developers/publish', developerController.publishApp);
router.put('/developers/apps/:appId', developerController.updateApp);

// Analytics
router.get('/developers/analytics', developerController.getAnalytics);

// Storage
router.get('/developers/storage', developerController.getStorage);
router.post('/developers/upload', upload.single('file'), developerController.uploadFile);

// Environment Variables
router.put('/developers/projects/:projectId/env', developerController.manageEnvVars);

// Team
router.post('/developers/projects/:projectId/team/invite', developerController.inviteTeamMember);
router.get('/developers/projects/:projectId/team', developerController.getTeam);

// ==================== Admin Routes (Protected) ====================
router.use('/admin', authenticate, authorize('admin'));

router.get('/admin/dashboard', adminController.getDashboard);
router.get('/admin/users', adminController.getUsers);
router.put('/admin/users/:userId', adminController.updateUser);
router.get('/admin/apps', adminController.getApps);
router.put('/admin/apps/:appId/approve', adminController.approveApp);
router.put('/admin/apps/:appId/feature', adminController.featureApp);
router.get('/admin/reports', adminController.getReports);
router.post('/admin/categories', adminController.manageCategories);
router.get('/admin/system/stats', adminController.getSystemStats);
router.get('/admin/security/logs', adminController.getSecurityLogs);
router.post('/admin/backup/create', adminController.createBackup);

// ==================== Webhooks ====================
router.post('/webhooks/github', (req, res) => {
  // Handle GitHub webhooks
  res.sendStatus(200);
});

router.post('/webhooks/docker', (req, res) => {
  // Handle Docker webhooks
  res.sendStatus(200);
});

export default router;
