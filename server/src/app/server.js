import dotenv from 'dotenv';

import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { SERVER_CONFIG, validateEnv } from '../config/env.js';
import { markInterruptedGenerationsOnStartup } from '../modules/generation/generation.service.js';
import { runStartupChecks } from '../modules/generation/services/health.service.js';
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from '../shared/middleware/errorHandler.js';
import { logError, logInfo } from '../shared/utils/logger.js';
import { createApp } from './createApp.js';

dotenv.config();

const app = createApp();
let server;

process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

const startServer = async () => {
  try {
    validateEnv();
    await connectDatabase();
    await markInterruptedGenerationsOnStartup();

    const healthResults = await runStartupChecks();
    if (!healthResults.healthy) {
      const unhealthy = healthResults.services.filter((s) => !s.healthy);
      logError('Critical services are unhealthy. Please check configuration.', {
        unhealthy: unhealthy.map((s) => ({ name: s.name, status: s.status })),
      });
      process.exit(1);
    }

    server = app.listen(SERVER_CONFIG.PORT, () => {
      logInfo('='.repeat(50));
      logInfo('AI Course Architect Server Started');
      logInfo('='.repeat(50));
      logInfo(`Environment: ${SERVER_CONFIG.NODE_ENV}`);
      logInfo(`Port: ${SERVER_CONFIG.PORT}`);
      logInfo(`API URL: http://localhost:${SERVER_CONFIG.PORT}`);
      logInfo(`Health Check: http://localhost:${SERVER_CONFIG.PORT}/api/health`);
      logInfo('='.repeat(50));
    });
  } catch (error) {
    logError('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logInfo(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM').catch((error) => {
    logError('Graceful shutdown failed:', error);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT').catch((error) => {
    logError('Graceful shutdown failed:', error);
    process.exit(1);
  });
});

startServer();

export default app;
