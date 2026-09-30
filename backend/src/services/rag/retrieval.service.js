const embeddingService = require('./embedding.service');
const qdrantService = require('./qdrant.service');

const retrievalService = {
  /**
   * Retrieves relevant text chunks for a query strictly bounded to the user
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.query
   * @param {number} params.limit
   * @param {string} params.sourceType - 'resume' | 'document' | 'note'
   * @param {string} params.sourceId
   */
  async retrieveRelevantChunks({ userId, query, limit = 4, sourceType, sourceId }) {
    if (!userId || !query) return [];

    const queryEmbedding = await embeddingService.generateEmbedding(query);

    const filter = {};
    if (sourceType) filter.sourceType = sourceType;
    if (sourceId) filter.sourceId = sourceId;

    const matches = await qdrantService.search({
      vector: queryEmbedding,
      userId,
      limit,
      filter,
    });

    return matches;
  },
};

module.exports = retrievalService;
