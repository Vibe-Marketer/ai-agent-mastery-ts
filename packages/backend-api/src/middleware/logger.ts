/**
 * Request Logger Middleware
 * Logs all incoming requests
 */

import { Context, Next } from 'hono';
import { logger } from '@ai-agent-mastery/shared';

/**
 * Request logging middleware
 */
export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const { method, url } = c.req;

  logger.info('Incoming request', {
    method,
    url,
    userAgent: c.req.header('User-Agent'),
  });

  await next();

  const duration = Date.now() - start;

  logger.info('Request completed', {
    method,
    url,
    status: c.res.status,
    duration: `${duration}ms`,
  });
}
