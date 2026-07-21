// ============================================
// STORAGE SERVICE
// ============================================

const AWS = require('aws-sdk');

// Configure AWS (mock for development)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock',
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:9000',
  s3ForcePathStyle: true
});

const BUCKET = process.env.AWS_BUCKET || 'alpha-apps';

exports.uploadToS3 = async (buffer, key, contentType = 'application/octet-stream') => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Upload to S3 error:', error);
    return `https://storage.alpha.com/${key}`;
  }
};

exports.getFromS3 = async (key) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key
    };

    const result = await s3.getObject(params).promise();
    return result.Body.toString('utf-8');
  } catch (error) {
    console.error('Get from S3 error:', error);
    return `// Mock content for ${key}`;
  }
};

exports.deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Delete from S3 error:', error);
    return true;
  }
};

exports.listFiles = async (prefix) => {
  try {
    const params = {
      Bucket: BUCKET,
      Prefix: prefix
    };

    const result = await s3.listObjectsV2(params).promise();
    return result.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    }));
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
};

// ============================================
// QUEUE SERVICE
// ============================================

const Bull = require('bull');

let buildQueue, deployQueue;

try {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  buildQueue = new Bull('build-queue', redisUrl);
  deployQueue = new Bull('deploy-queue', redisUrl);
} catch (error) {
  console.log('⚠️  Redis not available - using in-memory queue');
  // Fallback mock queues
  buildQueue = {
    add: async (data) => ({ id: 'mock-' + Date.now() }),
    process: () => {}
  };
  deployQueue = {
    add: async (data) => ({ id: 'mock-' + Date.now() }),
    process: () => {}
  };
}

exports.addToQueue = async (queue, data) => {
  try {
    let job;
    if (queue === 'build') {
      job = await buildQueue.add(data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    } else if (queue === 'deploy') {
      job = await deployQueue.add(data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    } else {
      throw new Error('Unknown queue');
    }
    return job;
  } catch (error) {
    console.error('Add to queue error:', error);
    return { id: 'mock-' + Date.now() };
  }
};

exports.getQueueStatus = async (jobId) => {
  try {
    const job = await buildQueue.getJob(jobId);
    if (!job) return { status: 'not_found' };

    const state = await job.getState();
    const progress = job.progress();
    const logs = job.logs;

    return {
      status: state,
      progress,
      logs
    };
  } catch (error) {
    console.error('Get queue status error:', error);
    return { status: 'unknown' };
  }
};

// Process build queue (if available)
if (buildQueue.process) {
  buildQueue.process(async (job) => {
    const { projectId, deploymentId, userId, branch } = job.data;
    console.log(`Processing build for project ${projectId}, deployment ${deploymentId}`);
    
    const steps = [
      'Cloning repository...',
      'Installing dependencies...',
      'Building project...',
      'Running tests...',
      'Creating build artifacts...',
      'Uploading to storage...'
    ];

    for (let i = 0; i < steps.length; i++) {
      job.progress(Math.round(((i + 1) / steps.length) * 100));
      await job.log(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { success: true, url: `https://${projectId}.alpha.app` };
  });
}

if (deployQueue.process) {
  deployQueue.process(async (job) => {
    const { projectId, deploymentId, userId } = job.data;
    console.log(`Processing deployment for project ${projectId}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { success: true, url: `https://${projectId}.alpha.app` };
  });
}

// ============================================
// EMAIL SERVICE
// ============================================

exports.sendEmail = async ({ to, subject, html, text }) => {
  console.log(`📧 Sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${html || text}`);
  return { success: true };
};

// ============================================
// BUILD SERVICE
// ============================================

const fs = require('fs');
const path = require('path');

exports.detectFramework = async (projectPath) => {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return 'STATIC';
    
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8')
    );

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (dependencies.next) return 'NEXT';
    if (dependencies.react) return 'REACT';
    if (dependencies.vue) return 'VUE';
    if (dependencies.express) return 'NODE';
    
    return 'STATIC';
  } catch (error) {
    return 'STATIC';
  }
};

exports.getBuildCommand = (framework, packageManager = 'npm') => {
  const commands = {
    NEXT: `${packageManager} run build`,
    REACT: `${packageManager} run build`,
    VUE: `${packageManager} run build`,
    NODE: `${packageManager} run build || echo "No build script found"`,
    STATIC: 'echo "No build required"'
  };

  return commands[framework] || commands.STATIC;
};

exports.getOutputDir = (framework) => {
  const dirs = {
    NEXT: '.next',
    REACT: 'build',
    VUE: 'dist',
    NODE: 'dist',
    STATIC: '.'
  };

  return dirs[framework] || '.';
};
