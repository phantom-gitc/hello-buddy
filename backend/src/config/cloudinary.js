const cloudinary = require('cloudinary').v2;
const config = require('./env');
const logger = require('../utils/logger');

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  logger.storage('Media storage ready');
} else {
  logger.warn('Cloudinary credentials missing or incomplete in environment. Upload features will run in mock/local fallback.');
}

module.exports = cloudinary;
