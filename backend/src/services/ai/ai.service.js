const config = require('../../config/env');
const groqProvider = require('./providers/groq.provider');
const geminiProvider = require('./providers/gemini.provider');
const promptService = require('./prompt.service');
const logger = require('../../utils/logger');

class AIService {
  constructor() {
    this.providers = {
      groq: groqProvider,
      gemini: geminiProvider,
    };
  }

  getProvider(preferredProvider) {
    const providerKey = preferredProvider || config.ai.defaultProvider;
    if (this.providers[providerKey] && this.providers[providerKey].isAvailable()) {
      return this.providers[providerKey];
    }
    // Fallback order: preferred -> groq -> gemini
    if (groqProvider.isAvailable()) return groqProvider;
    if (geminiProvider.isAvailable()) return geminiProvider;

    return this.providers[providerKey] || groqProvider;
  }

  async generateText({ messages, model, temperature, maxTokens, provider }) {
    const activeProvider = this.getProvider(provider);
    return activeProvider.generateText({ messages, model, temperature, maxTokens });
  }

  async generateStructuredOutput({ messages, model, schemaDescription, provider }) {
    const activeProvider = this.getProvider(provider);
    return activeProvider.generateStructuredOutput({ messages, model, schemaDescription });
  }

  async streamText({ messages, model, onChunk, onDone, onError, provider }) {
    const activeProvider = this.getProvider(provider);
    return activeProvider.streamText({ messages, model, onChunk, onDone, onError });
  }

  // --- Specialized AI Workflows ---

  async analyzeResume(resumeText) {
    const { system, user } = promptService.getResumeAnalysisPrompt(resumeText);
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    return this.generateStructuredOutput({
      messages,
      schemaDescription: 'Resume analysis JSON with score, summary, detectedRole, skills, projects, strengths, weaknesses, and actionableImprovements.',
    });
  }

  async generateInterviewPlan({ role, experienceYears, interviewType, difficulty, topics, resumeContext }) {
    const systemPrompt = promptService.getInterviewerSystemPrompt({
      role,
      experienceYears,
      interviewType,
      difficulty,
      resumeContext,
    });

    const userPrompt = `Create an interview plan with 5 structured questions assessing: ${(topics || []).join(', ') || 'core principles, practical engineering, system design, and behavioral situations'}.
Return a JSON array of question plans:
{
  "questions": [
    {
      "order": 1,
      "topic": string,
      "question": string,
      "criteria": string
    }
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return this.generateStructuredOutput({
      messages,
      schemaDescription: 'JSON with "questions" array containing order, topic, question, criteria.',
    });
  }

  async evaluateInterviewAnswer({ question, answer, role, difficulty }) {
    const { system, user } = promptService.getInterviewAnswerEvaluationPrompt({
      question,
      answer,
      role,
      difficulty,
    });

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    return this.generateStructuredOutput({
      messages,
      schemaDescription: 'JSON with score, technicalAccuracy, communicationClarity, relevance, strengths, weaknesses, feedback, idealAnswer, needsFollowUp, suggestedFollowUp.',
    });
  }

  async generateInterviewReport({ role, interviewType, questionsAndAnswers, overallAverageScore }) {
    const { system, user } = promptService.getInterviewReportPrompt({
      role,
      interviewType,
      questionsAndAnswers,
      overallAverageScore,
    });

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    return this.generateStructuredOutput({
      messages,
      schemaDescription: 'Final interview report JSON with overallScore, hiringRecommendation, summary, keyStrengths, criticalWeaknesses, detailedFeedback, recommendedTopicsToStudy, preparationRoadmap.',
    });
  }

  async evaluateLearningAnswer({ topic, question, answer }) {
    const { system, user } = promptService.getLearningAnswerEvaluationPrompt({
      topic,
      question,
      answer,
    });

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    return this.generateStructuredOutput({
      messages,
      schemaDescription: 'JSON with score, isUnderstood, feedback, clarification, identifiedWeaknesses, nextFollowUpQuestion.',
    });
  }
}

module.exports = new AIService();
