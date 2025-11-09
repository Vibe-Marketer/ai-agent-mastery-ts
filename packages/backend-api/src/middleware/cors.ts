/**
 * CORS Middleware
 * Configures cross-origin resource sharing
 */

import { Context, Next } from 'hono';
import { getEnv } from '@ai-agent-mastery/shared';

/**
 * CORS middleware
 */
export async function corsMiddleware(c: Context, next: Next) {
  const env = getEnv();

  // Get allowed origins from environment or use default
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ];

  const origin = c.req.header('Origin');

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    c.header('Access-Control-Allow-Origin', '*');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  return next();
}
