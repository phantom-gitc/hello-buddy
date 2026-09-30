const { Server } = require('socket.io');
const config = require('../config/env');
const logger = require('../utils/logger');
const socketAuthMiddleware = require('./socket.auth');
const registerChatSocket = require('./chat.socket');
const registerInterviewSocket = require('./interview.socket');
const registerLearningSocket = require('./learning.socket');

const initSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Attach server-side authentication
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id} (User: ${socket.user?.email})`);

    // Register module namespaces/handlers
    registerChatSocket(io, socket);
    registerInterviewSocket(io, socket);
    registerLearningSocket(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

module.exports = initSocketIO;
