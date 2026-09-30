const evaluationEngine = {
  /**
   * Sanitizes, clamps and validates structured evaluation returned from AI
   */
  processInterviewEvaluation(rawEvaluation) {
    const clamp = (val, def = 70) => {
      const num = Number(val);
      if (isNaN(num)) return def;
      return Math.min(100, Math.max(0, Math.round(num)));
    };

    return {
      score: clamp(rawEvaluation.score, 70),
      metrics: {
        technicalAccuracy: clamp(rawEvaluation.technicalAccuracy, 70),
        communicationClarity: clamp(rawEvaluation.communicationClarity, 70),
        relevance: clamp(rawEvaluation.relevance, 70),
      },
      feedback: typeof rawEvaluation.feedback === 'string' ? rawEvaluation.feedback : 'Solid effort, consider providing deeper implementation details.',
      strengths: Array.isArray(rawEvaluation.strengths) ? rawEvaluation.strengths : [],
      weaknesses: Array.isArray(rawEvaluation.weaknesses) ? rawEvaluation.weaknesses : [],
      idealAnswer: typeof rawEvaluation.idealAnswer === 'string' ? rawEvaluation.idealAnswer : '',
      needsFollowUp: Boolean(rawEvaluation.needsFollowUp),
      suggestedFollowUp: typeof rawEvaluation.suggestedFollowUp === 'string' ? rawEvaluation.suggestedFollowUp : '',
    };
  },

  /**
   * Computes weighted average score across multiple evaluations
   */
  calculateSessionAverages(evaluations = []) {
    if (!evaluations.length) return { averageScore: 0, technicalAvg: 0, communicationAvg: 0 };

    const sumScore = evaluations.reduce((acc, e) => acc + (e.score || 0), 0);
    const sumTech = evaluations.reduce((acc, e) => acc + (e.metrics?.technicalAccuracy || e.score || 0), 0);
    const sumComm = evaluations.reduce((acc, e) => acc + (e.metrics?.communicationClarity || e.score || 0), 0);

    return {
      averageScore: Math.round(sumScore / evaluations.length),
      technicalAvg: Math.round(sumTech / evaluations.length),
      communicationAvg: Math.round(sumComm / evaluations.length),
    };
  },
};

module.exports = evaluationEngine;
