import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 SkillVerse backend process listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = (signal: string) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections are hanging
  setTimeout(() => {
    logger.error('Could not close server connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Listen to termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Watch for catastrophic failures
process.on('uncaughtException', (error) => {
  logger.error(`CRITICAL UNCAUGHT EXCEPTION: ${error.message}\nStack: ${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  const errorMsg = reason instanceof Error ? reason.message : String(reason);
  const errorStack = reason instanceof Error ? reason.stack : '';
  logger.error(`CRITICAL UNHANDLED REJECTION: ${errorMsg}\nStack: ${errorStack}`);
  process.exit(1);
});
