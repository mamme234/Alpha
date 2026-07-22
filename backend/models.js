// models.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

// ==================== MongoDB Models ====================

// App Model
const appSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  banner: String,
  screenshots: [String],
  previewVideo: String,
  version: String,
  size: Number,
  category: String,
  tags: [String],
  developer: { type: Schema.Types.ObjectId, ref: 'User' },
  developerName: String,
  isVerified: { type: Boolean, default: false },
  isOpenSource: { type: Boolean, default: false },
  isFree: { type: Boolean, default: true },
  price: Number,
  license: String,
  platforms: [String],
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  requirements: String,
  website: String,
  privacyPolicy: String,
  termsOfService: String,
  repository: String,
  publishedAt: { type: Date, default: Date.now },
  lastUpdate: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isFeatured: { type: Boolean, default: false },
  isEditorChoice: { type: Boolean, default: false },
}, { timestamps: true });

// Project Model
const projectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  framework: String,
  language: String,
  isPrivate: { type: Boolean, default: true },
  repository: {
    url: String,
    type: { type: String, enum: ['git', 'github', 'gitlab'] },
  },
  deployments: [{ type: Schema.Types.ObjectId, ref: 'Deployment' }],
  settings: {
    envVars: Map,
    buildCommand: String,
    outputDir: String,
    nodeVersion: String,
  },
  createdAt: { type: Date, default: Date.now },
  lastDeployed: Date,
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
});

// Deployment Model
const deploymentSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  version: String,
  commit: String,
  branch: String,
  status: { 
    type: String, 
    enum: ['pending', 'building', 'deploying', 'success', 'failed', 'rollback'],
    default: 'pending'
  },
  url: String,
  customDomain: String,
  buildLogs: String,
  runtimeLogs: String,
  environment: {
    type: String,
    enum: ['production', 'staging', 'development'],
    default: 'production'
  },
  stats: {
    buildTime: Number,
    deployTime: Number,
    size: Number,
  },
  deployedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deployedAt: { type: Date, default: Date.now },
});

// Review Model
const reviewSchema = new Schema({
  app: { type: Schema.Types.ObjectId, ref: 'App', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String,
  content: String,
  isEdited: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

// Notification Model
const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['deployment', 'review', 'download', 'update', 'security', 'system'],
    required: true 
  },
  title: String,
  message: String,
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Analytics Model
const analyticsSchema = new Schema({
  app: { type: Schema.Types.ObjectId, ref: 'App' },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  type: { 
    type: String, 
    enum: ['download', 'view', 'visit', 'deployment', 'review', 'rating'],
    required: true 
  },
  metadata: {
    userId: Schema.Types.ObjectId,
    ip: String,
    country: String,
    device: String,
    browser: String,
    os: String,
    referrer: String,
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Export models
export const App = mongoose.model('App', appSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Deployment = mongoose.model('Deployment', deploymentSchema);
export const Review = mongoose.model('Review', reviewSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);

// ==================== PostgreSQL Models (Queries) ====================
// We'll implement these as functions in controllers using pgPool

export const pgModels = {
  // User queries
  User: {
    create: async (data) => { /* implementation */ },
    findByEmail: async (email) => { /* implementation */ },
    findById: async (id) => { /* implementation */ },
    update: async (id, data) => { /* implementation */ },
  },
  // Add more models...
};
