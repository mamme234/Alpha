const User = require('./models/User');
const Project = require('./models/Project');
const Deployment = require('./models/Deployment');
const App = require('./models/App');
const Analytics = require('./models/Analytics');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

// ============================================
// HELPERS
// ============================================

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// ============================================
// AUTH CONTROLLERS
// ============================================

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, role = 'USER' } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      role
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('projects');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, avatar, bio, website, github, twitter, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profile: { fullName, avatar, bio, website, github, twitter, location }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================
// PROJECT CONTROLLERS
// ============================================

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('deployments');

    res.json({ success: true, projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('deployments');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, framework, language } = req.body;

    let slug = slugify(name, { lower: true, strict: true });
    
    const existing = await Project.findOne({ slug });
    if (existing) {
      slug = `${slug}-${uuidv4().slice(0, 6)}`;
    }

    const project = await Project.create({
      name,
      slug,
      description,
      framework,
      language,
      userId: req.user.id
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { projects: project._id }
    });

    res.status(201).json({
      success: true,
      project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, framework, language } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, description, framework, language },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { projects: project._id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadCode = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Mock upload - in production, upload to S3
    const key = `projects/${project._id}/${file.originalname}`;
    const url = `https://storage.alpha.com/${key}`;

    project.filesKey = key;
    project.filesUrl = url;
    await project.save();

    res.json({
      success: true,
      url,
      message: 'Code uploaded successfully'
    });
  } catch (error) {
    console.error('Upload code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.connectGitHub = async (req, res) => {
  try {
    const { repoUrl, branch = 'main' } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { repoUrl, branch, repoProvider: 'GITHUB' },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      project,
      message: 'GitHub connected successfully'
    });
  } catch (error) {
    console.error('Connect GitHub error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCode = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Mock code - in production, fetch from S3
    const code = `// Project: ${project.name}\n// Framework: ${project.framework}\n\nconsole.log('Hello from Alpha!');`;

    res.json({
      success: true,
      code,
      project
    });
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateCode = async (req, res) => {
  try {
    const { code, filePath } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const key = `projects/${project._id}/${filePath || 'index.js'}`;
    const url = `https://storage.alpha.com/${key}`;

    project.filesKey = key;
    project.filesUrl = url;
    await project.save();

    res.json({
      success: true,
      url,
      message: 'Code updated successfully'
    });
  } catch (error) {
    console.error('Update code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteCode = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.filesKey = null;
    project.filesUrl = null;
    await project.save();

    res.json({
      success: true,
      message: 'Code deleted successfully'
    });
  } catch (error) {
    console.error('Delete code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Mock files
    const files = [
      { name: 'src', type: 'folder', path: 'src' },
      { name: 'index.js', type: 'file', path: 'src/index.js' },
      { name: 'app.js', type: 'file', path: 'src/app.js' },
      { name: 'package.json', type: 'file', path: 'package.json' },
      { name: 'README.md', type: 'file', path: 'README.md' }
    ];

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================
// DEPLOYMENT CONTROLLERS
// ============================================

exports.deploy = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { branch = 'main' } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deployment = await Deployment.create({
      projectId: project._id,
      status: 'QUEUED',
      branch,
      startedAt: new Date(),
      logs: [
        { timestamp: new Date(), level: 'INFO', message: 'Deployment queued' }
      ]
    });

    // Simulate deployment
    setTimeout(async () => {
      deployment.status = 'BUILDING';
      deployment.progress = 30;
      deployment.logs.push({ timestamp: new Date(), level: 'INFO', message: 'Building project...' });
      await deployment.save();

      setTimeout(async () => {
        deployment.status = 'DEPLOYING';
        deployment.progress = 70;
        deployment.logs.push({ timestamp: new Date(), level: 'INFO', message: 'Deploying to servers...' });
        await deployment.save();

        setTimeout(async () => {
          deployment.status = 'COMPLETED';
          deployment.progress = 100;
          deployment.url = `https://${project.slug}.alpha.app`;
          deployment.completedAt = new Date();
          deployment.logs.push({ timestamp: new Date(), level: 'INFO', message: 'Deployment completed successfully!' });
          await deployment.save();

          // Update project
          project.lastDeployment = deployment._id;
          await project.save();
        }, 2000);
      }, 2000);
    }, 2000);

    res.json({
      success: true,
      deployment,
      message: 'Deployment started'
    });
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDeployments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deployments = await Deployment.find({ projectId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      deployments
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDeployment = async (req, res) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const project = await Project.findOne({
      _id: deployment.projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      deployment
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const project = await Project.findOne({
      _id: deployment.projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      logs: deployment.logs || []
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.rollback = async (req, res) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const project = await Project.findOne({
      _id: deployment.projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rollbackDeployment = await Deployment.create({
      projectId: project._id,
      status: 'QUEUED',
      branch: deployment.branch,
      commitMessage: `Rollback to ${deployment._id}`,
      rollbackOf: deployment._id,
      logs: [
        { timestamp: new Date(), level: 'INFO', message: `Rollback to deployment ${deployment._id} started` }
      ]
    });

    res.json({
      success: true,
      deployment: rollbackDeployment,
      message: 'Rollback started'
    });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const project = await Project.findOne({
      _id: deployment.projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      status: deployment.status,
      progress: deployment.progress || 0,
      logs: deployment.logs ? deployment.logs.slice(-50) : []
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancelDeployment = async (req, res) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const project = await Project.findOne({
      _id: deployment.projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (deployment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed deployment' });
    }

    deployment.status = 'CANCELLED';
    deployment.completedAt = new Date();
    deployment.logs.push({ timestamp: new Date(), level: 'WARN', message: 'Deployment cancelled by user' });
    await deployment.save();

    res.json({
      success: true,
      message: 'Deployment cancelled'
    });
  } catch (error) {
    console.error('Cancel deployment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================
// APP CONTROLLERS
// ============================================

exports.getApps = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sort } = req.query;
    const skip = (page - 1) * limit;

    const query = { status: 'PUBLISHED' };
    if (category) query.category = category;

    let sortOption = { createdAt: -1 };
    if (sort === 'downloads') sortOption = { downloads: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };

    const apps = await App.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('projectId', 'name');

    const total = await App.countDocuments(query);

    res.json({
      success: true,
      apps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get apps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchApps = async (req, res) => {
  try {
    const { q, category, tags } = req.query;

    const query = { status: 'PUBLISHED' };
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };

    const apps = await App.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(50)
      .populate('projectId', 'name');

    res.json({
      success: true,
      apps,
      count: apps.length
    });
  } catch (error) {
    console.error('Search apps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getFeatured = async (req, res) => {
  try {
    const apps = await App.find({ 
      status: 'PUBLISHED',
      featured: true 
    })
    .limit(10)
    .populate('projectId', 'name');

    res.json({ success: true, apps });
  } catch (error) {
    console.error('Get featured error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const apps = await App.find({ status: 'PUBLISHED' })
      .sort({ downloads: -1, averageRating: -1 })
      .limit(20)
      .populate('projectId', 'name');

    res.json({ success: true, apps });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getNewApps = async (req, res) => {
  try {
    const apps = await App.find({ status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('projectId', 'name');

    res.json({ success: true, apps });
  } catch (error) {
    console.error('Get new apps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const apps = await App.find({ 
      category, 
      status: 'PUBLISHED' 
    })
    .sort({ downloads: -1 })
    .populate('projectId', 'name');

    res.json({ success: true, apps });
  } catch (error) {
    console.error('Get by category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getApp = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await App.findOne({ 
      $or: [{ _id: id }, { slug: id }],
      status: 'PUBLISHED'
    })
    .populate('projectId', 'name framework');

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    app.views = (app.views || 0) + 1;
    await app.save();

    res.json({ success: true, app });
  } catch (error) {
    console.error('Get app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.downloadApp = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await App.findById(id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    app.downloads = (app.downloads || 0) + 1;
    await app.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { 
        downloads: { 
          appId: app._id, 
          downloadedAt: new Date() 
        } 
      }
    });

    res.json({
      success: true,
      url: app.downloadUrl || `https://downloads.alpha.com/apps/${app._id}`,
      version: app.version,
      message: 'Download started'
    });
  } catch (error) {
    console.error('Download app error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await App.findById(id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const user = await User.findById(req.user.id);
    const isFavorited = user.favorites.includes(id);

    if (isFavorited) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { favorites: id }
      });
      app.favorites = (app.favorites || 0) - 1;
      await app.save();
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $push: { favorites: id }
      });
      app.favorites = (app.favorites || 0) + 1;
      await app.save();
    }

    res.json({
      success: true,
      isFavorited: !isFavorited
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const app = await App.findById(id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const existingReview = app.reviews.find(
      r => r.userId && r.userId.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You already reviewed this app' });
    }

    app.reviews.push({
      userId: req.user.id,
      rating,
      comment,
      createdAt: new Date()
    });

    const totalRating = app.reviews.reduce((sum, r) => sum + r.rating, 0);
    app.averageRating = totalRating / app.reviews.length;
    app.totalReviews = app.reviews.length;

    await app.save();

    res.status(201).json({
      success: true,
      review: app.reviews[app.reviews.length - 1],
      averageRating: app.averageRating
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const app = await App.findById(id).select('reviews');

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const start = (page - 1) * limit;
    const reviews = app.reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(start, start + limit);

    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findById(review.userId)
          .select('username profile.avatar');
        return {
          ...review._doc,
          user
        };
      })
    );

    res.json({
      success: true,
      reviews: populatedReviews,
      total: app.reviews.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const app = await App.findOne({
      'reviews._id': reviewId
    });

    if (!app) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = app.reviews.id(reviewId);
    if (!review || review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = new Date();

    const totalRating = app.reviews.reduce((sum, r) => sum + r.rating, 0);
    app.averageRating = totalRating / app.reviews.length;

    await app.save();

    res.json({
      success: true,
      review,
      averageRating: app.averageRating
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const app = await App.findOne({
      'reviews._id': reviewId
    });

    if (!app) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = app.reviews.id(reviewId);
    if (!review || review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    app.reviews.pull(reviewId);

    if (app.reviews.length > 0) {
      const totalRating = app.reviews.reduce((sum, r) => sum + r.rating, 0);
      app.averageRating = totalRating / app.reviews.length;
    } else {
      app.averageRating = 0;
    }
    app.totalReviews = app.reviews.length;

    await app.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ============================================
// ANALYTICS CONTROLLERS
// ============================================

exports.getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { period = '30d' } = req.query;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const analytics = await Analytics.findOne({ projectId });
    const deployments = await Deployment.find({ projectId });
    const app = await App.findOne({ projectId });

    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter(d => d.status === 'COMPLETED').length;

    res.json({
      success: true,
      analytics: {
        period,
        project: {
          id: project._id,
          name: project.name
        },
        deployments: {
          total: totalDeployments,
          successful: successfulDeployments,
          successRate: totalDeployments > 0 ? (successfulDeployments / totalDeployments * 100) : 0
        },
        app: {
          downloads: app ? app.downloads || 0 : 0,
          rating: app ? app.averageRating || 0 : 0,
          totalReviews: app ? app.totalReviews || 0 : 0
        },
        performance: analytics || {
          cpu: 0,
          memory: 0,
          storage: 0,
          responseTime: 0,
          uptime: 100
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getRealtimeAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const analytics = await Analytics.findOne({ projectId });

    res.json({
      success: true,
      realtime: {
        activeUsers: analytics ? analytics.activeUsers || 0 : 0,
        requestsPerMinute: analytics ? analytics.requestsPerMinute || 0 : 0,
        errorRate: analytics ? analytics.errorRate || 0 : 0,
        responseTime: analytics ? analytics.responseTime || 0 : 0
      }
    });
  } catch (error) {
    console.error('Get realtime analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDownloads = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const app = await App.findOne({ projectId });

    res.json({
      success: true,
      downloads: {
        total: app ? app.downloads || 0 : 0,
        daily: app ? app.dailyDownloads || [] : [],
        monthly: app ? app.monthlyDownloads || [] : []
      }
    });
  } catch (error) {
    console.error('Get downloads error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const analytics = await Analytics.findOne({ projectId });

    res.json({
      success: true,
      activeUsers: {
        total: analytics ? analytics.totalUsers || 0 : 0,
        daily: analytics ? analytics.dailyActiveUsers || 0 : 0,
        weekly: analytics ? analytics.weeklyActiveUsers || 0 : 0,
        monthly: analytics ? analytics.monthlyActiveUsers || 0 : 0,
        devices: analytics ? analytics.devices || [] : [],
        countries: analytics ? analytics.countries || [] : []
      }
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const analytics = await Analytics.findOne({ projectId });

    res.json({
      success: true,
      revenue: {
        total: analytics ? analytics.totalRevenue || 0 : 0,
        monthly: analytics ? analytics.monthlyRevenue || [] : [],
        byCountry: analytics ? analytics.revenueByCountry || [] : []
      }
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCrashes = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const analytics = await Analytics.findOne({ projectId });

    res.json({
      success: true,
      crashes: {
        total: analytics ? analytics.totalCrashes || 0 : 0,
        rate: analytics ? analytics.crashRate || 0 : 0,
        byVersion: analytics ? analytics.crashesByVersion || [] : [],
        byDevice: analytics ? analytics.crashesByDevice || [] : []
      }
    });
  } catch (error) {
    console.error('Get crashes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPerformance = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const analytics = await Analytics.findOne({ projectId });

    res.json({
      success: true,
      performance: {
        cpu: analytics ? analytics.cpu || 0 : 0,
        memory: analytics ? analytics.memory || 0 : 0,
        storage: analytics ? analytics.storage || 0 : 0,
        responseTime: analytics ? analytics.responseTime || 0 : 0,
        uptime: analytics ? analytics.uptime || 100 : 100,
        bandwidth: analytics ? analytics.bandwidth || 0 : 0
      }
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
