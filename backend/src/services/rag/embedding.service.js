const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const crypto = require('crypto');

class EmbeddingService {
  constructor() {
    this.dimension = 1536; // Vector dimension for Qdrant collection
  }

  /**
   * Generates a 1536-dimensional vector for a string using Google Gemini or deterministic fallback
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.dimension).fill(0);
    }

    if (config.ai.geminiApiKey && !config.ai.geminiApiKey.includes('dummy')) {
      try {
        const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text.slice(0, 8000));
        const rawVector = result.embedding?.values;

        if (Array.isArray(rawVector) && rawVector.length > 0) {
          // If raw vector length is 768, expand to 1536 to maintain collection compatibility
          if (rawVector.length === 768) {
            return [...rawVector, ...rawVector.map((v) => -v)];
          }
          if (rawVector.length === this.dimension) {
            return rawVector;
          }
        }
      } catch (err) {
        logger.warn('Failed to call Gemini embeddings API, falling back to local deterministic embedding:', {
          error: err.message,
        });
      }
    }

    // Deterministic fallback embedding for dev/testing
    return this._generateDeterministicVector(text);
  }

  /**
   * Generates deterministic normalized unit vector based on text hash
   */
  _generateDeterministicVector(text) {
    const vector = new Array(this.dimension);
    const hash = crypto.createHash('sha256').update(text).digest();

    for (let i = 0; i < this.dimension; i++) {
      const byte = hash[i % hash.length];
      vector[i] = (byte / 128.0) - 1.0;
    }

    // Normalize to unit length
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => val / (norm || 1));
  }
}

module.exports = new EmbeddingService();
