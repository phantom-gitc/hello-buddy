const SENSITIVE_KEYS = ['password', 'passwordHash', 'otp', 'token', 'refreshToken', 'accessToken', 'apiKey', 'authorization'];

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      masked[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

const formatTime = () => {
  const d = new Date();
  return d.toTimeString().split(' ')[0]; // HH:MM:SS
};

const isTestEnv = () => process.env.NODE_ENV === 'test';

const logger = {
  info: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} ℹ️  ${message}`);
  },

  success: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} ✅ ${colors.green}${message}${colors.reset}`);
  },

  warn: (message) => {
    if (isTestEnv()) return;
    console.warn(`${colors.dim}${formatTime()}${colors.reset} ⚠️  ${colors.yellow}${message}${colors.reset}`);
  },

  error: (message, meta = {}) => {
    console.error(`${colors.dim}${formatTime()}${colors.reset} ❌ ${colors.red}${message}${colors.reset}`);
    if (meta && Object.keys(meta).length > 0) {
      const safe = maskSensitiveData(meta);
      if (safe.error) {
        console.error(`${colors.dim}   └─ ${safe.error}${colors.reset}`);
      }
    }
  },

  debug: (message) => {
    if (process.env.NODE_ENV !== 'development' || isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} ⚡ ${colors.magenta}${message}${colors.reset}`);
  },

  // Emoji-tagged service helpers for quick visual identification
  db: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 🍃 ${colors.green}[MongoDB]${colors.reset} ${message}`);
  },

  redis: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} ⚡ ${colors.cyan}[Redis]${colors.reset} ${message}`);
  },

  email: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 📧 ${colors.yellow}[Brevo]${colors.reset} ${message}`);
  },

  storage: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} ☁️  ${colors.cyan}[Cloudinary]${colors.reset} ${message}`);
  },

  qdrant: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 🎯 ${colors.magenta}[Qdrant]${colors.reset} ${message}`);
  },

  ai: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 🤖 ${colors.magenta}[AI Engine]${colors.reset} ${message}`);
  },

  voice: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 🎙️ ${colors.yellow}[Voice/TTS]${colors.reset} ${message}`);
  },

  auth: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 🛡️ ${colors.green}[Auth]${colors.reset} ${message}`);
  },

  socket: (message) => {
    if (isTestEnv()) return;
    console.log(`${colors.dim}${formatTime()}${colors.reset} 🔌 ${colors.cyan}[Socket.IO]${colors.reset} ${message}`);
  },
};

module.exports = logger;
