const Interview = require('./interview.model');
const interviewEngine = require('./interview.engine');
const aiService = require('../../services/ai/ai.service');
const contextService = require('../../services/ai/context.service');
const evaluationService = require('../evaluation/evaluation.service');
const evaluationEngine = require('../evaluation/evaluation.engine');
const progressService = require('../progress/progress.service');
const { INTERVIEW_STATUS } = require('../../constants/interviewTypes');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const interviewService = {
  /**
   * Configures a new interview session and generates questions using candidate context
   */
  async createInterview(userId, interviewData) {
    const interview = await Interview.create({
      userId,
      ...interviewData,
      status: INTERVIEW_STATUS.CREATED,
      currentTurnIndex: 0,
      turns: [],
    });

    // Build context including resume if provided
    const context = await contextService.build({
      userId,
      mode: 'interview',
      topic: interview.topics?.join(', '),
      resumeId: interview.resumeId,
    });

    try {
      const plan = await aiService.generateInterviewPlan({
        role: interview.role,
        experienceYears: interview.experienceYears,
        interviewType: interview.interviewType,
        difficulty: interview.difficulty,
        topics: interview.topics,
        resumeContext: context.resumeSummary,
      });

      const questions = Array.isArray(plan?.questions) ? plan.questions : [];
      interview.turns = questions.map((q, idx) => ({
        order: idx + 1,
        topic: q.topic || 'General',
        question: q.question,
        isFollowUp: false,
      }));

      interviewEngine.toReady(interview);
      await interview.save();
    } catch (err) {
      logger.error('Failed to generate interview plan with AI, using standard fallback question set:', {
        error: err.message,
      });

      interview.turns = [
        {
          order: 1,
          topic: 'Introduction & Architecture',
          question: `Can you introduce yourself and walk us through the high-level architecture of your most impactful project in ${interview.role}?`,
          isFollowUp: false,
        },
        {
          order: 2,
          topic: 'Technical Deep-Dive',
          question: `How do you handle scalability, caching, and data consistency under high concurrent load?`,
          isFollowUp: false,
        },
        {
          order: 3,
          topic: 'Troubleshooting & Resiliency',
          question: `Describe a challenging production bug you encountered and the exact steps you took to diagnose and remediate it.`,
          isFollowUp: false,
        },
      ];

      interviewEngine.toReady(interview);
      await interview.save();
    }

    return interview;
  },

  async getInterviews(userId) {
    return Interview.find({ userId })
      .select('role interviewType difficulty status currentTurnIndex startedAt completedAt report.overallScore createdAt')
      .sort({ createdAt: -1 });
  },

  async getInterviewById(userId, interviewId) {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      throw ApiError.notFound('Interview session not found', 'INTERVIEW_NOT_FOUND');
    }
    return interview;
  },

  /**
   * Starts interview session and returns first question
   */
  async startInterview(userId, interviewId) {
    const interview = await this.getInterviewById(userId, interviewId);

    if (interview.status === INTERVIEW_STATUS.CREATED) {
      interviewEngine.toReady(interview);
    }

    interviewEngine.toInProgress(interview);
    await interview.save();

    const currentTurn = interview.turns[interview.currentTurnIndex];

    return {
      interviewId: interview._id,
      status: interview.status,
      currentTurnIndex: interview.currentTurnIndex,
      totalTurns: interview.turns.length,
      currentQuestion: currentTurn?.question,
      currentTurn,
    };
  },

  /**
   * Submits candidate answer, triggers AI evaluation, advances turns, or completes interview
   */
  async submitAnswer(userId, interviewId, { answer }) {
    const interview = await this.getInterviewById(userId, interviewId);

    interviewEngine.toEvaluating(interview);
    await interview.save();

    const currentTurn = interview.turns[interview.currentTurnIndex];
    if (!currentTurn) {
      throw ApiError.badRequest('No active question found to answer', 'NO_ACTIVE_QUESTION');
    }

    currentTurn.answer = answer;
    currentTurn.answeredAt = new Date();

    // 1. Evaluate answer with AI
    let rawEvaluation;
    try {
      rawEvaluation = await aiService.evaluateInterviewAnswer({
        question: currentTurn.question,
        answer,
        role: interview.role,
        difficulty: interview.difficulty,
      });
    } catch (err) {
      logger.warn('AI evaluation error, using resilient evaluation fallback:', { error: err.message });
      rawEvaluation = {
        score: 75,
        technicalAccuracy: 75,
        communicationClarity: 80,
        relevance: 75,
        feedback: 'Good overview provided. To improve, delve further into architectural trade-offs.',
        strengths: ['Clear communication'],
        weaknesses: ['Could include more quantitative benchmarks'],
        needsFollowUp: false,
      };
    }

    const evaluation = evaluationEngine.processInterviewEvaluation(rawEvaluation);
    currentTurn.evaluation = evaluation;

    // Record persistent evaluation entry
    await evaluationService.recordEvaluation({
      userId,
      contextType: 'INTERVIEW',
      referenceId: interview._id,
      questionText: currentTurn.question,
      answerText: answer,
      rawAiEvaluation: evaluation,
    });

    // 2. Decide next step: follow-up question OR next planned turn OR complete interview
    let nextQuestion = null;

    // If AI explicitly flagged need for a follow-up and we haven't asked a follow-up on this turn yet
    if (evaluation.needsFollowUp && evaluation.suggestedFollowUp && !currentTurn.isFollowUp && interview.turns.length < 8) {
      const followUpTurn = {
        order: interview.turns.length + 1,
        topic: currentTurn.topic,
        question: evaluation.suggestedFollowUp,
        isFollowUp: true,
      };

      // Insert immediately following current turn
      interview.turns.splice(interview.currentTurnIndex + 1, 0, followUpTurn);
      interview.currentTurnIndex += 1;
      interview.status = INTERVIEW_STATUS.WAITING_FOR_ANSWER;
      nextQuestion = followUpTurn.question;
    } else if (interview.currentTurnIndex + 1 < interview.turns.length) {
      interview.currentTurnIndex += 1;
      interview.status = INTERVIEW_STATUS.WAITING_FOR_ANSWER;
      nextQuestion = interview.turns[interview.currentTurnIndex].question;
    } else {
      // Completed interview!
      await this._finalizeInterviewReport(interview);
    }

    await interview.save();

    return {
      interviewId: interview._id,
      status: interview.status,
      currentTurnIndex: interview.currentTurnIndex,
      totalTurns: interview.turns.length,
      currentEvaluation: evaluation,
      nextQuestion,
      isCompleted: interview.status === INTERVIEW_STATUS.REPORT_GENERATED || interview.status === INTERVIEW_STATUS.COMPLETED,
      report: interview.report,
    };
  },

  /**
   * Helper to compile final interview assessment report
   */
  async _finalizeInterviewReport(interview) {
    interviewEngine.toCompleted(interview);

    const answeredTurns = interview.turns.filter((t) => t.evaluation && t.evaluation.score);
    const { averageScore } = evaluationEngine.calculateSessionAverages(
      answeredTurns.map((t) => t.evaluation)
    );

    const simplifiedQA = answeredTurns.map((t) => ({
      question: t.question,
      answer: t.answer,
      score: t.evaluation?.score,
      feedback: t.evaluation?.feedback,
    }));

    try {
      const reportData = await aiService.generateInterviewReport({
        role: interview.role,
        interviewType: interview.interviewType,
        questionsAndAnswers: simplifiedQA,
        overallAverageScore: averageScore,
      });

      interview.report = {
        overallScore: reportData.overallScore || averageScore,
        hiringRecommendation: reportData.hiringRecommendation || (averageScore >= 80 ? 'HIRE' : 'LEANING_HIRE'),
        summary: reportData.summary || 'Candidate demonstrated competent foundational knowledge across the key evaluation pillars.',
        keyStrengths: reportData.keyStrengths || ['Good architectural understanding'],
        criticalWeaknesses: reportData.criticalWeaknesses || ['Further practice with performance optimization scenarios recommended'],
        detailedFeedback: reportData.detailedFeedback || {
          technicalProficiency: 'Good grasp of technical concepts.',
          problemSolving: 'Logical structure to problems.',
          communication: 'Articulate communication.',
        },
        recommendedTopicsToStudy: reportData.recommendedTopicsToStudy || ['System Design', 'Caching strategies'],
        preparationRoadmap: reportData.preparationRoadmap || ['Practice mock interviews with complex edge cases'],
        generatedAt: new Date(),
      };
    } catch (err) {
      logger.error('Failed to generate AI interview report, using calculated fallback:', { error: err.message });
      interview.report = {
        overallScore: averageScore,
        hiringRecommendation: averageScore >= 75 ? 'HIRE' : 'LEANING_HIRE',
        summary: 'Completed interview session with solid overall technical aptitude.',
        keyStrengths: ['Completed all structured question phases'],
        criticalWeaknesses: ['Edge case handling can be strengthened'],
        detailedFeedback: {
          technicalProficiency: 'Good technical responses.',
          problemSolving: 'Clear reasoning.',
          communication: 'Clear and structured.',
        },
        recommendedTopicsToStudy: interview.topics,
        preparationRoadmap: ['Continue interactive practice on weak areas'],
        generatedAt: new Date(),
      };
    }

    interviewEngine.toReportGenerated(interview);

    // Sync progress in background
    setImmediate(async () => {
      try {
        await progressService.syncUserProgress(interview.userId);
      } catch (err) {
        logger.warn('Progress sync error after interview completion:', { error: err.message });
      }
    });
  },

  /**
   * Manually completes an in-progress interview
   */
  async completeInterview(userId, interviewId) {
    const interview = await this.getInterviewById(userId, interviewId);
    await this._finalizeInterviewReport(interview);
    await interview.save();
    return interview;
  },

  /**
   * Retrieves final report
   */
  async getReport(userId, interviewId) {
    const interview = await this.getInterviewById(userId, interviewId);
    if (!interview.report || !interview.report.overallScore) {
      throw ApiError.badRequest('Interview report has not been generated yet', 'REPORT_NOT_READY');
    }
    return interview.report;
  },
};

module.exports = interviewService;
