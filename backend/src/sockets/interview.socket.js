const interviewService = require('../modules/interview/interview.service');
const logger = require('../utils/logger');

const registerInterviewSocket = (io, socket) => {
  // Join interview room
  socket.on('interview:join', async ({ interviewId }) => {
    try {
      await interviewService.getInterviewById(socket.user._id, interviewId);
      socket.join(`interview:${interviewId}`);
      socket.emit('interview:joined', { interviewId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Start interview session
  socket.on('interview:start', async ({ interviewId }) => {
    try {
      const data = await interviewService.startInterview(socket.user._id, interviewId);
      io.to(`interview:${interviewId}`).emit('interview:question', {
        turnIndex: data.currentTurnIndex,
        totalTurns: data.totalTurns,
        question: data.currentQuestion,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Submit answer in real-time
  socket.on('interview:answer', async ({ interviewId, answer }) => {
    try {
      // 1. Notify client evaluation started
      socket.emit('interview:evaluating', { interviewId });

      // 2. Submit to service
      const result = await interviewService.submitAnswer(socket.user._id, interviewId, { answer });

      // 3. Emit feedback
      socket.emit('interview:feedback', {
        evaluation: result.currentEvaluation,
      });

      // 4. Next question, follow-up, or completion
      if (result.isCompleted) {
        io.to(`interview:${interviewId}`).emit('interview:complete', {
          interviewId,
          report: result.report,
        });
      } else if (result.nextQuestion) {
        const isFollowUp = result.currentEvaluation?.needsFollowUp;
        const eventName = isFollowUp ? 'interview:followup' : 'interview:question';

        io.to(`interview:${interviewId}`).emit(eventName, {
          turnIndex: result.currentTurnIndex,
          totalTurns: result.totalTurns,
          question: result.nextQuestion,
        });
      }
    } catch (err) {
      logger.error('Interview socket error:', { error: err.message });
      socket.emit('error', { message: err.message });
    }
  });
};

module.exports = registerInterviewSocket;
