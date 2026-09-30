const Evaluation = require('./evaluation.model');
const evaluationEngine = require('./evaluation.engine');

const evaluationService = {
  /**
   * Records an evaluation result in database
   */
  async recordEvaluation({ userId, contextType, referenceId, questionText, answerText, rawAiEvaluation }) {
    const processed = evaluationEngine.processInterviewEvaluation(rawAiEvaluation);

    const evaluation = await Evaluation.create({
      userId,
      contextType,
      referenceId,
      questionText,
      answerText,
      score: processed.score,
      metrics: processed.metrics,
      feedback: processed.feedback,
      strengths: processed.strengths,
      weaknesses: processed.weaknesses,
      idealAnswer: processed.idealAnswer,
      suggestedFollowUp: processed.suggestedFollowUp,
    });

    return evaluation;
  },

  /**
   * Retrieves evaluations for a specific reference (e.g. interviewId)
   */
  async getByReference(userId, referenceId) {
    return Evaluation.find({ userId, referenceId }).sort({ createdAt: 1 });
  },
};

module.exports = evaluationService;
