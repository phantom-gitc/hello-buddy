const http = require('http');
const app = require('./app');
const config = require('./config/env');
const connectDatabase = require('./config/database');
const initSocketIO = require('./sockets/socket');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Create HTTP Server
    const httpServer = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = initSocketIO(httpServer);
    app.set('io', io);

    // 4. Start listening
    httpServer.listen(config.port, () => {
      console.log('\n  \x1b[36m\x1b[1m🚀 HelloBuddy AI Backend\x1b[0m');
      console.log('  \x1b[2m──────────────────────────────────────────────────────────\x1b[0m');
      console.log(`  \x1b[32m●\x1b[0m \x1b[1mServer\x1b[0m     : \x1b[36mhttp://localhost:${config.port}\x1b[0m`);
      console.log(`  \x1b[32m●\x1b[0m \x1b[1mREST API\x1b[0m   : \x1b[36mhttp://localhost:${config.port}/api/v1\x1b[0m`);
      console.log(`  \x1b[32m●\x1b[0m \x1b[1mSocket.IO\x1b[0m  : \x1b[32mConnected & Ready\x1b[0m`);
      console.log(`  \x1b[32m●\x1b[0m \x1b[1mAI Engine\x1b[0m  : \x1b[35mGroq (${config.ai.groqModel}) + Gemini (${config.ai.geminiModel})\x1b[0m`);
      console.log(`  \x1b[32m●\x1b[0m \x1b[1mMode\x1b[0m       : \x1b[33m${config.env}\x1b[0m`);
      console.log('  \x1b[2m──────────────────────────────────────────────────────────\x1b[0m\n');
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      httpServer.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
