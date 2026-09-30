const Chat = require('../modules/chat/chat.model');
const aiService = require('../services/ai/ai.service');
const contextService = require('../services/ai/context.service');
const logger = require('../utils/logger');

const registerChatSocket = (io, socket) => {
  // Join a specific chat room
  socket.on('chat:join', async ({ chatId }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId: socket.user._id });
      if (!chat) {
        return socket.emit('error', { message: 'Chat conversation not found or unauthorized' });
      }

      socket.join(`chat:${chatId}`);
      socket.emit('chat:joined', { chatId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ chatId, isTyping }) => {
    socket.to(`chat:${chatId}`).emit('chat:typing', {
      userId: socket.user._id,
      name: socket.user.name,
      isTyping,
    });
  });

  // Real-time chat streaming message
  socket.on('chat:message', async ({ chatId, content }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId: socket.user._id });
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }

      // Add user message
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date(),
      };
      chat.messages.push(userMessage);

      // Notify room of new user message
      io.to(`chat:${chatId}`).emit('chat:message:received', userMessage);

      // Build context
      const context = await contextService.build({
        userId: socket.user._id,
        mode: 'chat',
        topic: chat.topic,
        query: content,
        resumeId: chat.includeResumeContext ? chat.resumeId : null,
      });

      const systemPrompt = `You are HelloBuddy, an elite AI Career Prep Advisor and Technical Interview Coach.
${context.user?.name ? `User Name: ${context.user.name}` : ''}
Topic: ${chat.topic}
${context.resumeSummary ? `\n[CANDIDATE RESUME PROFILE]:\n${context.resumeSummary}\n` : ''}
${context.relevantChunks ? `\n[RELEVANT KNOWLEDGE CHUNKS]:\n${context.relevantChunks}\n` : ''}`;

      const history = chat.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const messages = [{ role: 'system', content: systemPrompt }, ...history];

      socket.emit('chat:response:start', { chatId });

      let completeReply = '';

      await aiService.streamText({
        messages,
        onChunk: (chunk) => {
          completeReply += chunk;
          socket.emit('chat:response:chunk', { chatId, chunk });
        },
        onDone: async () => {
          const assistantMessage = {
            role: 'assistant',
            content: completeReply,
            timestamp: new Date(),
          };
          chat.messages.push(assistantMessage);
          chat.lastMessageAt = new Date();
          await chat.save();

          socket.emit('chat:response:end', {
            chatId,
            message: assistantMessage,
          });
        },
        onError: (err) => {
          socket.emit('error', { message: 'AI streaming error' });
        },
      });
    } catch (error) {
      logger.error('Socket chat error:', { error: error.message });
      socket.emit('error', { message: error.message });
    }
  });
};

module.exports = registerChatSocket;
