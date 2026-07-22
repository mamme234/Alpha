// validator.js
import Joi from 'joi';

export const validateSchema = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required(),
    role: Joi.string().valid('user', 'developer').default('user'),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    twoFactorCode: Joi.string().length(6).optional(),
  }),
  
  createProject: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(500),
    framework: Joi.string().valid('react', 'next', 'vue', 'angular', 'node', 'express', 'python', 'flask', 'django', 'php', 'static'),
    language: Joi.string().valid('javascript', 'typescript', 'python', 'php', 'java', 'go', 'rust', 'csharp'),
    isPrivate: Joi.boolean().default(true),
  }),
  
  publishApp: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    packageName: Joi.string().pattern(/^[a-z0-9._-]+$/).required(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
    description: Joi.string().max(2000),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    platforms: Joi.array().items(Joi.string().valid('web', 'android', 'ios', 'desktop')),
    isFree: Joi.boolean().default(true),
    price: Joi.number().min(0).when('isFree', { is: false, then: Joi.number().min(0.99) }),
    license: Joi.string(),
    website: Joi.string().uri(),
    privacyPolicy: Joi.string().uri(),
    termsOfService: Joi.string().uri(),
  }),
  
  deploy: Joi.object({
    branch: Joi.string().default('main'),
    environment: Joi.string().valid('production', 'staging', 'development').default('production'),
    commit: Joi.string().optional(),
  }),
  
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    title: Joi.string().max(100),
    content: Joi.string().max(1000),
  }),
  
  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    bio: Joi.string().max(500),
    avatar: Joi.string().uri(),
  }),
  
  envVars: Joi.object({
    envVars: Joi.object().pattern(Joi.string(), Joi.string()),
  }),
  
  teamInvite: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('owner', 'admin', 'developer', 'viewer').default('developer'),
  }),
};

// Helper to validate request
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    
    req.validatedBody = value;
    next();
  };
};
