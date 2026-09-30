const chunkingService = require('./chunking.service');
const embeddingService = require('./embedding.service');
const qdrantService = require('./qdrant.service');
const retrievalService = require('./retrieval.service');
const logger = require('../../utils/logger');

const ragService = {
  /**
   * Ingests a text document into the vector database
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.text
   * @param {string} params.sourceType - 'resume' | 'pdf'
   * @param {string} params.sourceId
   * @param {string} [params.documentId]
   */
  async ingestDocument({ userId, text, sourceType, sourceId, documentId }) {
    if (!text || !userId) return;

    logger.info(`Starting RAG ingestion for user ${userId}, source: ${sourceType} (${sourceId})`);

    const chunks = chunkingService.chunkText(text, { chunkSize: 250, overlap: 40 });
    const points = [];

    for (const chunk of chunks) {
      const vector = await embeddingService.generateEmbedding(chunk.text);
      points.push({
        vector,
        payload: {
          userId: String(userId),
          sourceType,
          sourceId: String(sourceId),
          documentId: documentId ? String(documentId) : String(sourceId),
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
        },
      });
    }

    await qdrantService.upsertPoints(points);
    logger.info(`Ingested ${points.length} chunks into Qdrant for ${sourceType} ${sourceId}`);
    return { chunkCount: points.length };
  },

  /**
   * Retrieves context chunks for LLM prompt augmentation
   */
  async getRelevantContext({ userId, query, limit = 4, sourceType }) {
    const results = await retrievalService.retrieveRelevantChunks({
      userId,
      query,
      limit,
      sourceType,
    });

    return results.map((r) => r.text).join('\n---\n');
  },

  /**
   * Removes all vector embeddings related to a specific sourceId
   */
  async removeSourceVectors(userId, sourceId) {
    return qdrantService.deleteBySourceId(userId, sourceId);
  },
};

module.exports = ragService;
