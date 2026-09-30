const { QdrantClient } = require('@qdrant/js-client-rest');
const config = require('./env');
const logger = require('../utils/logger');

let qdrantClient;

try {
  qdrantClient = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey || undefined,
    checkCompatibility: false,
  });
  logger.qdrant('Vector database ready');
} catch (error) {
  logger.warn(`Qdrant client configuration failed: ${error.message}`);
}

module.exports = qdrantClient;
