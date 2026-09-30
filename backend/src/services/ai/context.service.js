const User = require('../../modules/users/user.model');
const ragService = require('../rag/rag.service');
const logger = require('../../utils/logger');

const contextService = {
  /**
   * Central context builder for AI tasks
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.mode - 'interview' | 'learning' | 'chat'
   * @param {string} [params.topic]
   * @param {string} [params.query]
   * @param {string} [params.resumeId]
   */
  async build({ userId, mode, topic = '', query = '', resumeId = null }) {
    const context = {
      user: null,
      resumeSummary: '',
      relevantChunks: '',
    };

    if (!userId) return context;

    try {
      // 1. Fetch user profile
      const user = await User.findById(userId).select(
        'name targetRole experienceYears skills preferredDomains learningPreferences'
      );
      context.user = user;

      // 2. Retrieve relevant RAG chunks if query is provided
      if (query) {
        context.relevantChunks = await ragService.getRelevantContext({
          userId,
          query: `${topic} ${query}`.trim(),
          limit: 3,
        });
      }

      // 3. Include resume context if in interview mode or explicitly queried
      if (mode === 'interview' || mode === 'chat') {
        const Resume = require('../../modules/resume/resume.model');
        const resumeFilter = { userId };
        if (resumeId) resumeFilter._id = resumeId;

        const resume = await Resume.findOne(resumeFilter).sort({ createdAt: -1 });
        if (resume && resume.parsedData) {
          context.resumeSummary = `
Candidate Target Role: ${resume.parsedData.detectedRole || user?.targetRole || 'Software Engineer'}
Skills: ${(resume.parsedData.skills?.technical || user?.skills || []).join(', ')}
Key Projects: ${(resume.parsedData.projects || []).map((p) => `${p.title}: ${p.technologies?.join(', ')}`).join(' | ')}
Experience Summary: ${resume.parsedData.experienceSummary || ''}
          `.trim();
        }
      }
    } catch (err) {
      logger.warn('Error while assembling context in contextService:', { error: err.message });
    }

    return context;
  },
};

module.exports = contextService;
