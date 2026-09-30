const evaluationEngine = require('../src/modules/evaluation/evaluation.engine');

describe('📊 Evaluation Engine', () => {
  test('📏 Score clamping within [0, 100]', () => {
    const raw = {
      score: 150,
      technicalAccuracy: -20,
      communicationClarity: 88,
      relevance: 95,
      feedback: 'Good communication',
      strengths: ['Clear articulate answer'],
      weaknesses: [],
    };

    const processed = evaluationEngine.processInterviewEvaluation(raw);

    expect(processed.score).toBe(100);
    expect(processed.metrics.technicalAccuracy).toBe(0);
    expect(processed.metrics.communicationClarity).toBe(88);
  });

  test('📈 Compute session averages', () => {
    const evaluations = [
      { score: 80, metrics: { technicalAccuracy: 80, communicationClarity: 80 } },
      { score: 90, metrics: { technicalAccuracy: 90, communicationClarity: 90 } },
    ];

    const { averageScore, technicalAvg, communicationAvg } = evaluationEngine.calculateSessionAverages(evaluations);

    expect(averageScore).toBe(85);
    expect(technicalAvg).toBe(85);
    expect(communicationAvg).toBe(85);
  });
});
