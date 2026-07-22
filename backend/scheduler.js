// scheduler.js
import cron from 'node-cron';
import { Deployment, App } from './models.js';
import { getRedis } from './db.js';
import { emailService, analyticsService } from './services.js';

export const startScheduler = () => {
  // Clean up failed deployments every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Cleaning up failed deployments...');
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Deployment.deleteMany({
        status: 'failed',
        deployedAt: { $lt: oneDayAgo }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
  
  // Generate daily analytics reports at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('📊 Generating daily analytics...');
    try {
      // Generate reports for all apps
      const apps = await App.find({ status: 'published' });
      for (const app of apps) {
        await analyticsService.getAppAnalytics(app._id, '1d');
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  });
  
  // Send weekly summary emails on Monday
  cron.schedule('0 9 * * 1', async () => {
    console.log('📧 Sending weekly summaries...');
    // Implementation...
  });
  
  // Check for expiring SSL certificates daily
  cron.schedule('0 0 * * *', async () => {
    console.log('🔒 Checking SSL certificates...');
    // Implementation...
  });
  
  // Clean up expired sessions every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🧹 Cleaning up expired sessions...');
    const pool = getPgPool();
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
  });
  
  // Database backup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('💾 Creating database backup...');
    // Implementation...
  });
  
  // Update app ratings (recalculate from reviews)
  cron.schedule('0 3 * * *', async () => {
    console.log('⭐ Updating app ratings...');
    // Implementation...
  });
  
  console.log('⏰ Scheduler started');
};
