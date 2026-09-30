const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, {
      autoIndex: config.env !== 'production',
    });

    logger.db(`Connected to ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Reconnection will be attempted automatically.');
    });

    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error.message });
    throw error;
  }
};

module.exports = connectDatabase;
