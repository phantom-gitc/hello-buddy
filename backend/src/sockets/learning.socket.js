const learningService = require('../modules/learning/learning.service');
const logger = require('../utils/logger');

const registerLearningSocket = (io, socket) => {
  socket.on('learning:join', async ({ sessionId }) => {
    try {
      await learningService.getSessionById(socket.user._id, sessionId);
      socket.join(`learning:${sessionId}`);
      socket.emit('learning:joined', { sessionId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('learning:message', async ({ sessionId, message }) => {
    try {
      const result = await learningService.postMessage(socket.user._id, sessionId, { message });
      io.to(`learning:${sessionId}`).emit('learning:teacher:reply', {
        reply: result.reply,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('learning:answer', async ({ sessionId, answer }) => {
    try {
      const result = await learningService.submitAnswer(socket.user._id, sessionId, { answer });
      socket.emit('learning:feedback', {
        evaluation: result.evaluation,
        masteryScore: result.session.masteryScore,
        weakAreas: result.session.weakAreasIdentified,
      });

      if (result.session.currentQuestion) {
        socket.emit('learning:question', {
          question: result.session.currentQuestion,
          conceptIndex: result.session.currentConceptIndex,
        });
      }
    } catch (err) {
      logger.error('Learning socket answer error:', { error: err.message });
      socket.emit('error', { message: err.message });
    }
  });
};

module.exports = registerLearningSocket;
