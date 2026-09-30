const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  database: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hello-buddy',
  },

  redis: {
    url: (process.env.REDIS_URL || 'redis://127.0.0.1:6379').replace(/^redis-cli\s+-u\s+/i, '').trim(),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_for_development_32chars',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_for_development_32chars',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'cookie_secret_key_development',
  },

  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'no-reply@hellobuddy.ai',
    senderName: process.env.BREVO_SENDER_NAME || 'HelloBuddy AI Career Prep',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  qdrant: {
    url: process.env.QDRANT_URL || 'http://127.0.0.1:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'career_prep_vectors',
  },

  ai: {
    defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'groq',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  },

  voice: {
    kokoroApiUrl: process.env.KOKORO_API_URL || 'http://127.0.0.1:8880/v1',
  },
};

// Freeze config object to prevent accidental mutation at runtime
Object.freeze(config);
Object.freeze(config.database);
Object.freeze(config.redis);
Object.freeze(config.jwt);
Object.freeze(config.brevo);
Object.freeze(config.cloudinary);
Object.freeze(config.qdrant);
Object.freeze(config.ai);
Object.freeze(config.voice);

module.exports = config;
