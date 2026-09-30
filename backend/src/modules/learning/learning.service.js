const LearningSession = require('./learning.model');
const aiService = require('../../services/ai/ai.service');
const promptService = require('../../services/ai/prompt.service');
const ApiError = require('../../utils/ApiError');

const CURATED_DOMAINS = [
  {
    id: 'frontend',
    name: 'Frontend Development',
    topics: ['React & Component Architecture', 'JavaScript Closures & Async Event Loop', 'State Management & Redux', 'Browser Performance & Rendering', 'CSS Architecture & Flexbox/Grid'],
  },
  {
    id: 'backend',
    name: 'Backend & Systems',
    topics: ['Node.js & Express Internal Architecture', 'REST & GraphQL API Design', 'MongoDB Indexing & Aggregations', 'Redis Caching & In-Memory Strategies', 'Authentication, JWT & Security Best Practices'],
  },
  {
    id: 'system_design',
    name: 'System Design & Scalability',
    topics: ['Microservices vs Monoliths', 'Message Queues & Event-Driven Architecture', 'Horizontal Scaling & Load Balancing', 'Database Sharding & Replication', 'Rate Limiting & API Gateways'],
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    topics: ['Docker & Containerization', 'CI/CD Pipelines with GitHub Actions', 'Kubernetes Fundamentals', 'AWS Cloud Architecture', 'Observability & Monitoring'],
  },
];

const learningService = {
  getDomains() {
    return CURATED_DOMAINS.map((d) => ({ id: d.id, name: d.name }));
  },

  getTopics(domainId) {
    if (domainId) {
      const match = CURATED_DOMAINS.find((d) => d.id === domainId.toLowerCase() || d.name.toLowerCase() === domainId.toLowerCase());
      return match ? match.topics : [];
    }
    return CURATED_DOMAINS.flatMap((d) => d.topics);
  },

  /**
   * Initializes interactive learning session and generates the first lesson concept
   */
  async createSession(userId, { domain, role, topic, difficulty }) {
    const session = await LearningSession.create({
      userId,
      domain,
      role,
      topic,
      difficulty,
      interactions: [],
    });

    // Generate initial lesson explanation and check question
    const systemPrompt = promptService.getTeacherSystemPrompt({
      domain,
      role,
      topic,
      difficulty,
    });

    const initialPrompt = `Introduce the topic "${topic}" for a ${role} learner at ${difficulty} level.
Structure your reply into:
1. Conceptual Overview (2-3 concise paragraphs, clear intuition)
2. Practical Code Example or Real-World Architecture Context
3. A Thought-Provoking Question to test if I understood the core principle.`;

    const response = await aiService.generateText({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: initialPrompt },
      ],
    });

    // Extract check question or default
    const questionMatch = response.match(/Question:?\s*(.*)$/im);
    const initialQuestion = questionMatch ? questionMatch[1] : `In your own words, what is the most critical trade-off when using ${topic}?`;

    session.interactions.push({
      type: 'EXPLANATION',
      content: response,
      timestamp: new Date(),
    });

    session.currentQuestion = initialQuestion;
    await session.save();

    return session;
  },

  async getSessions(userId) {
    return LearningSession.find({ userId }).sort({ createdAt: -1 });
  },

  async getSessionById(userId, sessionId) {
    const session = await LearningSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw ApiError.notFound('Learning session not found', 'SESSION_NOT_FOUND');
    }
    return session;
  },

  /**
   * User asks a follow-up or clarifying question to the AI teacher
   */
  async postMessage(userId, sessionId, { message }) {
    const session = await this.getSessionById(userId, sessionId);

    session.interactions.push({
      type: 'QUESTION',
      content: message,
      timestamp: new Date(),
    });

    const systemPrompt = promptService.getTeacherSystemPrompt({
      domain: session.domain,
      role: session.role,
      topic: session.topic,
      difficulty: session.difficulty,
    });

    const history = session.interactions.slice(-6).map((i) => ({
      role: i.type === 'QUESTION' || i.type === 'ANSWER' ? 'user' : 'assistant',
      content: i.content,
    }));

    const response = await aiService.generateText({
      messages: [{ role: 'system', content: systemPrompt }, ...history],
    });

    session.interactions.push({
      type: 'EXPLANATION',
      content: response,
      timestamp: new Date(),
    });

    await session.save();

    return {
      reply: response,
      session,
    };
  },

  /**
   * User submits an answer to the teacher's check-for-understanding question
   */
  async submitAnswer(userId, sessionId, { answer }) {
    const session = await this.getSessionById(userId, sessionId);

    const question = session.currentQuestion || `Explain the core mechanism of ${session.topic}`;

    // 1. Record student answer
    session.interactions.push({
      type: 'ANSWER',
      content: answer,
      timestamp: new Date(),
    });

    // 2. Evaluate answer with structured AI output
    const evaluation = await aiService.evaluateLearningAnswer({
      topic: session.topic,
      question,
      answer,
    });

    // 3. Update session stats and weaknesses
    if (evaluation.identifiedWeaknesses && evaluation.identifiedWeaknesses.length > 0) {
      session.weakAreasIdentified = Array.from(
        new Set([...session.weakAreasIdentified, ...evaluation.identifiedWeaknesses])
      );
    }

    session.masteryScore = Math.round(
      (session.masteryScore * session.currentConceptIndex + evaluation.score) /
        (session.currentConceptIndex + 1)
    );
    session.currentConceptIndex += 1;
    session.currentQuestion = evaluation.nextFollowUpQuestion || '';

    session.interactions.push({
      type: 'FEEDBACK',
      content: `${evaluation.feedback}\n\n${evaluation.clarification ? `Clarification: ${evaluation.clarification}` : ''}`,
      evaluation: {
        score: evaluation.score,
        isUnderstood: evaluation.isUnderstood,
        feedback: evaluation.feedback,
        identifiedWeaknesses: evaluation.identifiedWeaknesses,
      },
      timestamp: new Date(),
    });

    if (session.currentConceptIndex >= 5) {
      session.status = 'COMPLETED';
    }

    await session.save();

    return {
      evaluation,
      session,
    };
  },

  /**
   * Aggregates learning progress for the user
   */
  async getProgress(userId) {
    const sessions = await LearningSession.find({ userId });
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;

    const weakAreas = Array.from(new Set(sessions.flatMap((s) => s.weakAreasIdentified)));
    const averageScore = totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.masteryScore || 0), 0) / totalSessions)
      : 0;

    return {
      totalSessions,
      completedSessions,
      averageScore,
      weakAreas,
      recentSessions: sessions.slice(0, 5),
    };
  },
};

module.exports = learningService;
