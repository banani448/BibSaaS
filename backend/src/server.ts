import http from 'http';
import config from './config/env';
import logger from './config/logger';
import createApp from './app';
import { disconnectDatabase } from './config/database';

const app = createApp();
const server = http.createServer(app);

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    await disconnectDatabase();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

const startServer = () => {
  server.listen(config.PORT, () => {
    logger.info(`🚀 ${config.APP_NAME} server started on port ${config.PORT}`);
    logger.info(`📖 Environment: ${config.NODE_ENV}`);
    logger.info(`🌐 API URL: ${config.API_URL}`);
    logger.info(`📚 Documentation: ${config.API_URL}/docs`);
    logger.info(`💚 Health check: ${config.API_URL}/health`);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { promise: String(promise), reason: String(reason) });
    process.exit(1);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle SIGINT
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Start server only if not in test mode
if (config.NODE_ENV !== 'test') {
  startServer();
}

export { app, server };
