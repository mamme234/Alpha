// controllers.js
import { App, Project, Deployment, Review, Notification, Analytics } from './models.js';
import { getPgPool } from './db.js';
import { deploymentService, storageService, emailService } from './services.js';

// ==================== Auth Controllers ====================
export const authController = {
  register: async (req, res) => {
    const { username, email, password, role } = req.body;
    // Implementation...
  },
  
  login: async (req, res) => {
    const { email, password, twoFactorCode } = req.body;
    // Implementation...
  },
  
  logout: async (req, res) => {
    // Implementation...
  },
  
  refreshToken: async (req, res) => {
    // Implementation...
  },
  
  verifyEmail: async (req, res) => {
    // Implementation...
  },
  
  requestPasswordReset: async (req, res) => {
    // Implementation...
  },
  
  resetPassword: async (req, res) => {
    // Implementation...
  },
};

// ==================== User Controllers ====================
export const userController = {
  getDashboard: async (req, res) => {
    const userId = req.user.userId;
    // Get featured apps, recommendations, etc.
    const featuredApps = await App.find({ isFeatured: true, status: 'published' })
      .limit(10)
      .sort({ downloads: -1 });
      
    const trendingApps = await App.find({ status: 'published' })
      .sort({ downloads: -1, rating: -1 })
      .limit(10);
      
    const newApps = await App.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10);
    
    // Get user's favorites, downloads, etc.
    const favorites = await getFavorites(userId);
    const recentDownloads = await getDownloadHistory(userId, 5);
    
    res.json({
      featured: featuredApps,
      trending: trendingApps,
      newReleases: newApps,
      favorites,
      recentDownloads,
    });
  },
  
  getAppDetails: async (req, res) => {
    const { appId } = req.params;
    // Implementation...
  },
  
  downloadApp: async (req, res) => {
    const { appId } = req.params;
    // Implementation...
  },
  
  favoriteApp: async (req, res) => {
    const { appId } = req.params;
    // Implementation...
  },
  
  getFavorites: async (req, res) => {
    // Implementation...
  },
  
  getDownloadHistory: async (req, res) => {
    // Implementation...
  },
  
  writeReview: async (req, res) => {
    const { appId } = req.params;
    const { rating, title, content } = req.body;
    // Implementation...
  },
  
  getReviews: async (req, res) => {
    const { appId } = req.params;
    // Implementation...
  },
  
  searchApps: async (req, res) => {
    const { query, filters, sort, page } = req.query;
    // Implementation...
  },
  
  getCategories: async (req, res) => {
    // Implementation...
  },
  
  getNotifications: async (req, res) => {
    // Implementation...
  },
  
  markNotificationRead: async (req, res) => {
    // Implementation...
  },
};

// ==================== Developer Controllers ====================
export const developerController = {
  getDashboard: async (req, res) => {
    const developerId = req.user.userId;
    
    const projects = await Project.find({ owner: developerId });
    const deployments = await Deployment.find({ 
      project: { $in: projects.map(p => p._id) },
      status: 'success'
    });
    const publishedApps = await App.find({ developer: developerId });
    
    // Aggregate stats
    const totalDownloads = publishedApps.reduce((sum, app) => sum + app.downloads, 0);
    
    res.json({
      projects: projects.length,
      activeDeployments: deployments.length,
      publishedApps: publishedApps.length,
      totalDownloads,
      recentActivity: await getRecentActivity(developerId),
      usage: {
        storage: await getStorageUsage(developerId),
        cpu: await getCpuUsage(developerId),
        memory: await getMemoryUsage(developerId),
      }
    });
  },
  
  createProject: async (req, res) => {
    const { name, description, framework, language, isPrivate } = req.body;
    // Implementation...
  },
  
  getProject: async (req, res) => {
    const { projectId } = req.params;
    // Implementation...
  },
  
  updateProject: async (req, res) => {
    const { projectId } = req.params;
    // Implementation...
  },
  
  deleteProject: async (req, res) => {
    const { projectId } = req.params;
    // Implementation...
  },
  
  getProjectFiles: async (req, res) => {
    const { projectId } = req.params;
    const { path } = req.query;
    // Implementation...
  },
  
  saveProjectFile: async (req, res) => {
    const { projectId } = req.params;
    const { path, content } = req.body;
    // Implementation...
  },
  
  deployProject: async (req, res) => {
    const { projectId } = req.params;
    const { branch, environment, commit } = req.body;
    
    try {
      const deployment = await deploymentService.deploy(projectId, {
        branch,
        environment,
        commit
      });
      
      res.json({ deploymentId: deployment._id, status: 'deploying' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  getDeploymentStatus: async (req, res) => {
    const { deploymentId } = req.params;
    // Implementation...
  },
  
  getDeploymentLogs: async (req, res) => {
    const { deploymentId } = req.params;
    // Implementation...
  },
  
  rollbackDeployment: async (req, res) => {
    const { deploymentId } = req.params;
    // Implementation...
  },
  
  publishApp: async (req, res) => {
    const { 
      name, packageName, version, description, category, 
      tags, platforms, isFree, price, license, website,
      privacyPolicy, termsOfService, projectId 
    } = req.body;
    
    // Implementation...
  },
  
  updateApp: async (req, res) => {
    const { appId } = req.params;
    // Implementation...
  },
  
  getAnalytics: async (req, res) => {
    const { appId, timeRange } = req.query;
    // Implementation...
  },
  
  getStorage: async (req, res) => {
    // Implementation...
  },
  
  uploadFile: async (req, res) => {
    // Implementation...
  },
  
  manageEnvVars: async (req, res) => {
    const { projectId } = req.params;
    const { envVars } = req.body;
    // Implementation...
  },
  
  inviteTeamMember: async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body;
    // Implementation...
  },
  
  getTeam: async (req, res) => {
    const { projectId } = req.params;
    // Implementation...
  },
};

// ==================== Admin Controllers ====================
export const adminController = {
  getDashboard: async (req, res) => {
    // Implementation...
  },
  
  getUsers: async (req, res) => {
    // Implementation...
  },
  
  updateUser: async (req, res) => {
    // Implementation...
  },
  
  getApps: async (req, res) => {
    // Implementation...
  },
  
  approveApp: async (req, res) => {
    // Implementation...
  },
  
  featureApp: async (req, res) => {
    // Implementation...
  },
  
  getReports: async (req, res) => {
    // Implementation...
  },
  
  manageCategories: async (req, res) => {
    // Implementation...
  },
  
  getSystemStats: async (req, res) => {
    // Implementation...
  },
  
  getSecurityLogs: async (req, res) => {
    // Implementation...
  },
  
  createBackup: async (req, res) => {
    // Implementation...
  },
};

// ==================== Helper Functions ====================
const getFavorites = async (userId) => {
  const pool = getPgPool();
  const result = await pool.query(
    'SELECT app_id FROM favorites WHERE user_id = $1',
    [userId]
  );
  const appIds = result.rows.map(r => r.app_id);
  return await App.find({ _id: { $in: appIds } });
};

const getDownloadHistory = async (userId, limit = 10) => {
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT app_id, downloaded_at 
     FROM downloads 
     WHERE user_id = $1 
     ORDER BY downloaded_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  const appIds = result.rows.map(r => r.app_id);
  const apps = await App.find({ _id: { $in: appIds } });
  
  return result.rows.map(row => ({
    app: apps.find(a => a._id.toString() === row.app_id.toString()),
    downloadedAt: row.downloaded_at,
  }));
};

const getRecentActivity = async (developerId) => {
  // Combine deployments, reviews, downloads, etc.
  const deployments = await Deployment.find({ 
    project: { $in: await Project.find({ owner: developerId }).select('_id') }
  }).sort({ deployedAt: -1 }).limit(10);
  
  return deployments.map(d => ({
    type: 'deployment',
    message: `Deployed version ${d.version}`,
    timestamp: d.deployedAt,
  }));
};

const getStorageUsage = async (developerId) => {
  // Calculate storage usage from S3 or filesystem
  return {
    used: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
    total: 10 * 1024 * 1024 * 1024, // 10 GB
    percentage: 12,
  };
};

const getCpuUsage = async (developerId) => {
  // Implementation...
  return { used: 45, total: 100 };
};

const getMemoryUsage = async (developerId) => {
  // Implementation...
  return { used: 2.4, total: 8 };
};
