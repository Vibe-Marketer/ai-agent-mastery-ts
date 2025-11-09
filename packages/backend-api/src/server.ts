#!/usr/bin/env node
/**
 * Server
 * Start the Hono server with Node.js adapter
 */

import { serve } from '@hono/node-server';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { createApp } from './app.js';

// Get environment variables
const env = getEnv();

// Create application
const app = createApp();

// Start server
const port = env.PORT || 8000;

logger.info('Starting server...', {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
});

serve({
  fetch: app.fetch,
  port: Number(port),
}, (info) => {
  logger.info(`Server is running`, {
    url: `http://localhost:${info.port}`,
    port: info.port,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});
