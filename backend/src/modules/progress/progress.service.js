const Progress = require('./progress.model');
const Interview = require('../interview/interview.model');
const LearningSession = require('../learning/learning.model');

const progressService = {
  /**
   * Retrieves or initializes progress metrics for a user
   */
  async getUserProgress(userId) {
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = await Progress.create({
        userId,
        interviewsCompleted: 0,
        averageInterviewScore: 0,
        learningSessionsCompleted: 0,
        averageLearningScore: 0,
        skillScores: [],
        identifiedWeakAreas: [],
        identifiedStrengths: [],
        readinessScore: 0,
      });
    }

    return progress;
  },

  /**
   * Syncs and recalculates user readiness score from interview & learning completions
   */
  async syncUserProgress(userId) {
    const progress = await this.getUserProgress(userId);

    // Fetch interviews
    const interviews = await Interview.find({ userId, status: { $in: ['COMPLETED', 'REPORT_GENERATED'] } });
    progress.interviewsCompleted = interviews.length;

    if (interviews.length > 0) {
      const totalScore = interviews.reduce((sum, inv) => sum + (inv.report?.overallScore || 0), 0);
      progress.averageInterviewScore = Math.round(totalScore / interviews.length);
    }

    // Fetch learning sessions
    const learningSessions = await LearningSession.find({ userId, status: 'COMPLETED' });
    progress.learningSessionsCompleted = learningSessions.length;

    if (learningSessions.length > 0) {
      const totalLearnScore = learningSessions.reduce((sum, s) => sum + (s.masteryScore || 0), 0);
      progress.averageLearningScore = Math.round(totalLearnScore / learningSessions.length);
    }

    // Weighted readiness score calculation
    const interviewWeight = progress.interviewsCompleted > 0 ? 0.6 : 0;
    const learningWeight = progress.learningSessionsCompleted > 0 ? 0.4 : 0;
    const totalWeight = interviewWeight + learningWeight;

    if (totalWeight > 0) {
      progress.readinessScore = Math.round(
        (progress.averageInterviewScore * interviewWeight + progress.averageLearningScore * learningWeight) /
          totalWeight
      );
    } else {
      progress.readinessScore = 0;
    }

    await progress.save();
    return progress;
  },
};

module.exports = progressService;
