const mongoose = require('mongoose');

// ============================================
// USER MODEL
// ============================================

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['USER', 'DEVELOPER', 'ADMIN'],
    default: 'USER'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profile: {
    fullName: String,
    avatar: String,
    bio: String,
    website: String,
    github: String,
    twitter: String,
    location: String
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  }],
  downloads: [{
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App'
    },
    downloadedAt: Date
  }],
  notifications: [{
    title: String,
    message: String,
    type: String,
    read: {
      type: Boolean,
      default: false
    },
    link: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

userSchema.index({ username: 'text', email: 'text' });

const User = mongoose.model('User', userSchema);

// ============================================
// PROJECT MODEL
// ============================================

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  framework: {
    type: String,
    enum: ['REACT', 'NEXT', 'VUE', 'NUXT', 'ANGULAR', 'SVELTE', 'NODE', 'PYTHON', 'GO', 'RUST', 'STATIC', 'OTHER'],
    default: 'OTHER'
  },
  language: {
    type: String,
    enum: ['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'GO', 'RUST', 'JAVA', 'PHP', 'RUBY', 'OTHER'],
    default: 'JAVASCRIPT'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repoUrl: String,
  repoProvider: {
    type: String,
    enum: ['GITHUB', 'GITLAB', 'BITBUCKET', 'NONE'],
    default: 'NONE'
  },
  branch: {
    type: String,
    default: 'main'
  },
  filesKey: String,
  filesUrl: String,
  lastDeployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment'
  },
  team: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      default: 'MEMBER'
    }
  }],
  envVars: [{
    key: String,
    value: String,
    encrypted: {
      type: Boolean,
      default: true
    }
  }],
  domains: [{
    domain: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  buildSettings: {
    buildCommand: String,
    outputDir: String,
    installCommand: String,
    nodeVersion: {
      type: String,
      default: '18'
    }
  },
  publishedApp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  }
}, {
  timestamps: true
});

projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ slug: 1 });

const Project = mongoose.model('Project', projectSchema);

// ============================================
// DEPLOYMENT MODEL
// ============================================

const deploymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['QUEUED', 'BUILDING', 'DEPLOYING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'QUEUED'
  },
  commitHash: String,
  commitMessage: String,
  branch: {
    type: String,
    default: 'main'
  },
  url: String,
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
      default: 'INFO'
    },
    message: String
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  rollbackOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment'
  },
  buildTime: Number,
  startedAt: Date,
  completedAt: Date,
  size: Number,
  files: [{
    path: String,
    size: Number
  }]
}, {
  timestamps: true
});

deploymentSchema.index({ projectId: 1, createdAt: -1 });
deploymentSchema.index({ status: 1 });

const Deployment = mongoose.model('Deployment', deploymentSchema);

// ============================================
// APP MODEL
// ============================================

const appSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  icon: String,
  banner: String,
  description: String,
  screenshots: [String],
  video: String,
  version: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['GAMES', 'EDUCATION', 'AI', 'BUSINESS', 'FINANCE', 'HEALTH', 'SOCIAL', 'ENTERTAINMENT', 'TOOLS', 'PHOTOGRAPHY', 'SHOPPING', 'MUSIC', 'TRAVEL', 'NEWS', 'PRODUCTIVITY'],
    required: true
  },
  tags: [String],
  license: String,
  minAndroidVersion: String,
  minIOSVersion: String,
  privacyPolicy: String,
  termsUrl: String,
  website: String,
  downloadUrl: String,
  webAppUrl: String,
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'REMOVED'],
    default: 'DRAFT'
  },
  featured: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  permissions: [String],
  supportedDevices: [String],
  changelog: [{
    version: String,
    changes: [String],
    releasedAt: Date
  }],
  dailyDownloads: [{
    date: Date,
    count: Number
  }],
  monthlyDownloads: [{
    month: String,
    count: Number
  }]
}, {
  timestamps: true
});

appSchema.index({ name: 'text', description: 'text', tags: 'text' });
appSchema.index({ category: 1, status: 1 });
appSchema.index({ downloads: -1 });
appSchema.index({ averageRating: -1 });

const App = mongoose.model('App', appSchema);

// ============================================
// ANALYTICS MODEL
// ============================================

const analyticsSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  storage: { type: Number, default: 0 },
  bandwidth: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 },
  uptime: { type: Number, default: 100 },
  errorRate: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  dailyActiveUsers: { type: Number, default: 0 },
  weeklyActiveUsers: { type: Number, default: 0 },
  monthlyActiveUsers: { type: Number, default: 0 },
  requestsPerMinute: { type: Number, default: 0 },
  traffic: [{
    date: Date,
    visits: Number,
    uniqueVisitors: Number
  }],
  countries: [{
    country: String,
    visits: Number,
    percentage: Number
  }],
  devices: [{
    type: String,
    count: Number,
    percentage: Number
  }],
  totalRevenue: { type: Number, default: 0 },
  monthlyRevenue: [{
    month: String,
    amount: Number
  }],
  revenueByCountry: [{
    country: String,
    amount: Number
  }],
  totalCrashes: { type: Number, default: 0 },
  crashRate: { type: Number, default: 0 },
  crashesByVersion: [{
    version: String,
    count: Number
  }],
  crashesByDevice: [{
    device: String,
    count: Number
  }]
}, {
  timestamps: true
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// ============================================
// EXPORT ALL MODELS
// ============================================

module.exports = {
  User,
  Project,
  Deployment,
  App,
  Analytics
};
