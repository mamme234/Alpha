// services.js
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import nodemailer from 'nodemailer';
import { Project, Deployment } from './models.js';
import { getRedis } from './db.js';
import config from './config.js';

const execAsync = promisify(exec);

// ==================== Deployment Service ====================
export const deploymentService = {
  async deploy(projectId, options = {}) {
    const { branch = 'main', environment = 'production', commit } = options;
    
    // Get project
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    // Create deployment record
    const deployment = new Deployment({
      project: projectId,
      branch,
      environment,
      commit,
      status: 'pending',
    });
    await deployment.save();
    
    // Start deployment asynchronously
    this._runDeployment(project, deployment).catch(error => {
      console.error('Deployment failed:', error);
      deployment.status = 'failed';
      deployment.runtimeLogs = error.message;
      deployment.save();
    });
    
    return deployment;
  },
  
  async _runDeployment(project, deployment) {
    try {
      // Update status
      deployment.status = 'building';
      await deployment.save();
      
      // Clone/update repository
      const repoPath = path.join('/tmp', `repo-${uuidv4()}`);
      await this._cloneRepository(project, repoPath, deployment.branch);
      
      // Build project
      const buildResult = await this._buildProject(project, repoPath);
      deployment.buildLogs = buildResult.logs;
      
      // Deploy to hosting
      deployment.status = 'deploying';
      await deployment.save();
      
      const deployResult = await this._deployToHosting(
        project, 
        buildResult.outputPath,
        deployment
      );
      
      // Update deployment
      deployment.status = 'success';
      deployment.url = deployResult.url;
      deployment.stats = {
        buildTime: buildResult.time,
        deployTime: deployResult.time,
        size: deployResult.size,
      };
      await deployment.save();
      
      // Update project
      project.lastDeployed = new Date();
      project.status = 'active';
      await project.save();
      
      // Notify
      await this._sendDeploymentNotification(project, deployment);
      
      // Cleanup
      await fs.rm(repoPath, { recursive: true, force: true });
      
      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      deployment.runtimeLogs = error.message;
      await deployment.save();
      throw error;
    }
  },
  
  async _cloneRepository(project, repoPath, branch) {
    // Implementation for cloning git repository
    const repoUrl = project.repository?.url;
    if (!repoUrl) {
      throw new Error('No repository URL found');
    }
    
    await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${repoPath}`);
  },
  
  async _buildProject(project, repoPath) {
    const startTime = Date.now();
    let logs = '';
    let outputPath = repoPath;
    
    // Determine build strategy based on framework
    const framework = project.framework?.toLowerCase() || '';
    
    try {
      if (['react', 'next', 'vue', 'angular'].includes(framework)) {
        // Frontend framework
        logs += await this._buildFrontend(repoPath, framework);
        outputPath = path.join(repoPath, 'dist');
      } else if (['node', 'express', 'nest'].includes(framework)) {
        // Node.js
        logs += await this._buildNode(repoPath);
        outputPath = repoPath;
      } else if (framework === 'python' || framework === 'flask' || framework === 'django') {
        // Python
        logs += await this._buildPython(repoPath);
        outputPath = repoPath;
      } else {
        // Static or default
        logs += await this._buildStatic(repoPath);
      }
    } catch (error) {
      logs += `\n❌ Build error: ${error.message}`;
      throw error;
    }
    
    return {
      logs,
      outputPath,
      time: Date.now() - startTime,
    };
  },
  
  async _buildFrontend(repoPath, framework) {
    let commands = [];
    
    if (['react', 'next', 'vue', 'angular'].includes(framework)) {
      commands.push('npm install');
      commands.push(`npm run build`);
    }
    
    let logs = '';
    for (const cmd of commands) {
      logs += `\n> ${cmd}\n`;
      const { stdout, stderr } = await execAsync(cmd, { cwd: repoPath });
      logs += stdout || stderr;
    }
    return logs;
  },
  
  async _buildNode(repoPath) {
    let logs = '';
    try {
      logs += '\n> npm install\n';
      const { stdout, stderr } = await execAsync('npm install', { cwd: repoPath });
      logs += stdout || stderr;
    } catch (error) {
      throw new Error(`Node build failed: ${error.message}`);
    }
    return logs;
  },
  
  async _buildPython(repoPath) {
    let logs = '';
    try {
      logs += '\n> pip install -r requirements.txt\n';
      const { stdout, stderr } = await execAsync('pip install -r requirements.txt', { cwd: repoPath });
      logs += stdout || stderr;
    } catch (error) {
      throw new Error(`Python build failed: ${error.message}`);
    }
    return logs;
  },
  
  async _buildStatic(repoPath) {
    // Just copy as-is
    return '✓ Static site (no build required)';
  },
  
  async _deployToHosting(project, outputPath, deployment) {
    const startTime = Date.now();
    const domain = this._generateDomain(project, deployment);
    
    // Upload to S3/CDN
    await this._uploadToCDN(outputPath, domain);
    
    // Create route/URL
    const url = `https://${domain}`;
    
    return {
      url,
      time: Date.now() - startTime,
      size: await this._getDirectorySize(outputPath),
    };
  },
  
  _generateDomain(project, deployment) {
    const subdomain = `${project.name}-${deployment._id.toString().slice(-6)}`;
    return `${subdomain}.${config.deployment.baseDomain}`;
  },
  
  async _uploadToCDN(outputPath, domain) {
    // Implementation for S3/Cloudflare upload
    const s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
    });
    
    const files = await this._walkDirectory(outputPath);
    for (const file of files) {
      const key = file.replace(outputPath, '').replace(/^\//, '');
      const content = await fs.readFile(file);
      
      await s3Client.send(new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: `${domain}/${key}`,
        Body: content,
        ContentType: this._getContentType(key),
      }));
    }
  },
  
  async _walkDirectory(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this._walkDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  },
  
  _getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };
    return types[ext] || 'application/octet-stream';
  },
  
  async _getDirectorySize(dir) {
    let size = 0;
    const files = await this._walkDirectory(dir);
    for (const file of files) {
      const stats = await fs.stat(file);
      size += stats.size;
    }
    return size;
  },
  
  async _sendDeploymentNotification(project, deployment) {
    // Send notification via email/websocket
    const socket = await getSocket();
    socket.to(`project:${project._id}`).emit('deployment', {
      projectId: project._id,
      deploymentId: deployment._id,
      status: deployment.status,
      url: deployment.url,
    });
  },
  
  async rollback(deploymentId) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');
    
    // Re-deploy the previous version
    // Implementation...
    
    return deployment;
  },
};

// ==================== Storage Service ====================
export const storageService = {
  s3Client: null,
  
  init() {
    this.s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
    });
  },
  
  async uploadFile(file, path, metadata = {}) {
    const key = `${path}/${file.originalname}`;
    await this.s3Client.send(new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: metadata,
    }));
    
    return key;
  },
  
  async getFileUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });
    
    return await getSignedUrl(this.s3Client, command, { expiresIn });
  },
  
  async uploadProjectFile(projectId, filePath, content) {
    // Implementation...
  },
  
  async getProjectFile(projectId, filePath) {
    // Implementation...
  },
  
  async deleteFile(key) {
    // Implementation...
  },
};

// ==================== Email Service ====================
export const emailService = {
  transporter: null,
  
  init() {
    this.transporter = nodemailer.createTransport({
      service: config.email.service,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  },
  
  async sendEmail({ to, subject, html, text }) {
    try {
      await this.transporter.sendMail({
        from: `"Platform" <${config.email.user}>`,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  },
  
  async sendVerificationEmail(email, token) {
    const url = `${config.frontendUrl}/verify-email?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `<h1>Welcome!</h1><p>Click <a href="${url}">here</a> to verify your email.</p>`,
    });
  },
  
  async sendPasswordResetEmail(email, token) {
    const url = `${config.frontendUrl}/reset-password?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `<h1>Reset Password</h1><p>Click <a href="${url}">here</a> to reset your password.</p>`,
    });
  },
  
  async sendDeploymentNotification(email, projectName, status, url) {
    await this.sendEmail({
      to: email,
      subject: `Deployment ${status}: ${projectName}`,
      html: `<h1>Deployment ${status}</h1><p>Your project ${projectName} has been deployed.</p>`,
    });
  },
};

// ==================== Git Service ====================
export const gitService = {
  async createRepository(name, isPrivate = true) {
    // Implementation for creating git repository
  },
  
  async getRepository(repoId) {
    // Implementation...
  },
  
  async commitFile(repoPath, filePath, message) {
    await execAsync(`cd ${repoPath} && git add ${filePath} && git commit -m "${message}"`);
  },
  
  async push(repoPath, branch = 'main') {
    await execAsync(`cd ${repoPath} && git push origin ${branch}`);
  },
  
  async pull(repoPath, branch = 'main') {
    await execAsync(`cd ${repoPath} && git pull origin ${branch}`);
  },
  
  async getBranches(repoPath) {
    const { stdout } = await execAsync(`cd ${repoPath} && git branch -a`);
    return stdout.split('\n').filter(b => b.trim()).map(b => b.replace('*', '').trim());
  },
  
  async getCommits(repoPath, limit = 50) {
    const { stdout } = await execAsync(`cd ${repoPath} && git log -n ${limit} --pretty=format:"%H|%an|%ae|%ad|%s"`);
    return stdout.split('\n').map(line => {
      const [hash, author, email, date, message] = line.split('|');
      return { hash, author, email, date, message };
    });
  },
  
  async createBranch(repoPath, branchName, fromBranch = 'main') {
    await execAsync(`cd ${repoPath} && git checkout -b ${branchName} ${fromBranch}`);
  },
};

// ==================== Analytics Service ====================
export const analyticsService = {
  async trackEvent({ userId, appId, projectId, type, metadata = {} }) {
    const event = new Analytics({
      user: userId,
      app: appId,
      project: projectId,
      type,
      metadata: {
        ...metadata,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      },
    });
    await event.save();
    
    // Update aggregate stats
    await this._updateAggregates(type, appId, projectId);
  },
  
  async _updateAggregates(type, appId, projectId) {
    if (type === 'download' && appId) {
      await App.findByIdAndUpdate(appId, { $inc: { downloads: 1 } });
    }
    if (type === 'view' && appId) {
      // Update view count
    }
  },
  
  async getAppAnalytics(appId, timeRange = '7d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));
    
    const events = await Analytics.find({
      app: appId,
      createdAt: { $gte: startDate },
    });
    
    return {
      downloads: events.filter(e => e.type === 'download').length,
      views: events.filter(e => e.type === 'view').length,
      uniqueUsers: new Set(events.map(e => e.metadata.userId)).size,
      countries: this._aggregateByKey(events, 'metadata.country'),
      devices: this._aggregateByKey(events, 'metadata.device'),
      browsers: this._aggregateByKey(events, 'metadata.browser'),
      daily: this._aggregateDaily(events),
    };
  },
  
  _aggregateByKey(events, keyPath) {
    const result = {};
    const keys = keyPath.split('.');
    
    for (const event of events) {
      let value = event;
      for (const key of keys) {
        value = value?.[key];
        if (!value) break;
      }
      if (value) {
        result[value] = (result[value] || 0) + 1;
      }
    }
    
    return Object.entries(result)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, count]) => ({ ...obj, [key]: count }), {});
  },
  
  _aggregateDaily(events) {
    const daily = {};
    for (const event of events) {
      const date = event.createdAt.toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;
    }
    return daily;
  },
};

// ==================== Database Service ====================
export const databaseService = {
  async createDatabase(name, type = 'mongodb') {
    // Implementation...
  },
  
  async getDatabaseStats(dbId) {
    // Implementation...
  },
  
  async backupDatabase(dbId) {
    // Implementation...
  },
  
  async restoreDatabase(dbId, backupId) {
    // Implementation...
  },
};

// Initialize services
storageService.init();
emailService.init();

export default {
  deploymentService,
  storageService,
  emailService,
  gitService,
  analyticsService,
  databaseService,
};
