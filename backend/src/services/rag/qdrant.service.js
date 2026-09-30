const qdrantClient = require('../../config/qdrant');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const crypto = require('crypto');

// In-memory vector store fallback for local development when Qdrant is not running
const inMemoryVectors = new Map();

class QdrantService {
  constructor() {
    this.collectionName = config.qdrant.collectionName;
    this.dimension = 1536;
    this._initialized = false;
  }

  async ensureCollection() {
    if (!qdrantClient) return;

    try {
      const collections = await qdrantClient.getCollections();
      const exists = collections.collections?.some((c) => c.name === this.collectionName);

      if (!exists) {
        await qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: this.dimension,
            distance: 'Cosine',
          },
        });
        logger.info(`Qdrant collection "${this.collectionName}" created successfully.`);
      }
      this._initialized = true;
    } catch (error) {
      logger.warn(`Qdrant ensureCollection error (${error.message}). In-memory vector fallback enabled.`);
    }
  }

  /**
   * Inserts vector points into Qdrant with payload
   * @param {Array<{ id?: string, vector: number[], payload: object }>} points
   */
  async upsertPoints(points) {
    await this.ensureCollection();

    const formattedPoints = points.map((p) => ({
      id: p.id || crypto.randomUUID(),
      vector: p.vector,
      payload: p.payload,
    }));

    try {
      if (qdrantClient && this._initialized) {
        await qdrantClient.upsert(this.collectionName, {
          points: formattedPoints,
        });
        return { count: formattedPoints.length };
      }
    } catch (err) {
      logger.warn(`Qdrant upsert failed (${err.message}). Storing in local memory fallback.`);
    }

    // Fallback store
    for (const p of formattedPoints) {
      inMemoryVectors.set(p.id, p);
    }
    return { count: formattedPoints.length };
  }

  /**
   * Searches for top similar vectors filtered strictly by userId
   */
  async search({ vector, userId, limit = 5, filter = {} }) {
    await this.ensureCollection();

    const mustFilters = [{ key: 'userId', match: { value: String(userId) } }];

    if (filter.sourceType) {
      mustFilters.push({ key: 'sourceType', match: { value: filter.sourceType } });
    }
    if (filter.sourceId) {
      mustFilters.push({ key: 'sourceId', match: { value: filter.sourceId } });
    }

    try {
      if (qdrantClient && this._initialized) {
        const results = await qdrantClient.search(this.collectionName, {
          vector,
          limit,
          filter: {
            must: mustFilters,
          },
          with_payload: true,
        });

        return results.map((r) => ({
          score: r.score,
          text: r.payload?.text || '',
          metadata: r.payload,
        }));
      }
    } catch (err) {
      logger.warn(`Qdrant search failed (${err.message}). Performing memory search.`);
    }

    // Memory fallback cosine similarity search
    const results = [];
    for (const item of inMemoryVectors.values()) {
      if (String(item.payload?.userId) !== String(userId)) continue;
      if (filter.sourceType && item.payload?.sourceType !== filter.sourceType) continue;

      const score = this._cosineSimilarity(vector, item.vector);
      results.push({
        score,
        text: item.payload?.text || '',
        metadata: item.payload,
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Deletes points associated with a specific resource/sourceId
   */
  async deleteBySourceId(userId, sourceId) {
    try {
      if (qdrantClient && this._initialized) {
        await qdrantClient.delete(this.collectionName, {
          filter: {
            must: [
              { key: 'userId', match: { value: String(userId) } },
              { key: 'sourceId', match: { value: String(sourceId) } },
            ],
          },
        });
      }
    } catch (err) {
      logger.warn(`Qdrant delete failed: ${err.message}`);
    }

    for (const [id, item] of inMemoryVectors.entries()) {
      if (String(item.payload?.userId) === String(userId) && String(item.payload?.sourceId) === String(sourceId)) {
        inMemoryVectors.delete(id);
      }
    }
  }

  _cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dot / ((Math.sqrt(normA) * Math.sqrt(normB)) || 1);
  }
}

module.exports = new QdrantService();
