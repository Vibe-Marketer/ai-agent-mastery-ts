/**
 * Application
 * Main Hono application setup
 */

import { Hono } from 'hono';
import { logger } from '@ai-agent-mastery/shared';
import {
  corsMiddleware,
  authMiddleware,
  requestLogger,
} from './middleware/index.js';
import {
  chatRouter,
  documentsRouter,
  conversationsRouter,
  healthRouter,
} from './routes/index.js';

/**
 * Create and configure Hono application
 */
export function createApp() {
  const app = new Hono();

  // Global middleware
  app.use('*', corsMiddleware);
  app.use('*', requestLogger);
  app.use('*', authMiddleware);

  // Health check (no auth required)
  app.route('/api/health', healthRouter);

  // API routes (auth required)
  app.route('/api/chat', chatRouter);
  app.route('/api/documents', documentsRouter);
  app.route('/api/conversations', conversationsRouter);

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      name: 'AI Agent Mastery API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        chat: '/api/chat',
        documents: '/api/documents',
        conversations: '/api/conversations',
      },
    });
  });

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        error: 'Not Found',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
      404
    );
  });

  // Error handler
  app.onError((err, c) => {
    logger.error('Unhandled error', { error: err });

    return c.json(
      {
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
      },
      500
    );
  });

  return app;
}
