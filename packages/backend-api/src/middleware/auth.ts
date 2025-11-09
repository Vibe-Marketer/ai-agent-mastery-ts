/**
 * Authentication Middleware
 * Validates API keys and user authentication
 */

import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { getEnv, logger } from '@ai-agent-mastery/shared';

export interface AuthContext {
  userId?: string;
  isAuthenticated: boolean;
}

/**
 * Authentication middleware
 * Validates Bearer token using Supabase auth
 */
export async function authMiddleware(c: Context, next: Next) {
  const env = getEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.set('auth', { isAuthenticated: false });
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid auth token', { error });
      c.set('auth', { isAuthenticated: false });
      return next();
    }

    c.set('auth', {
      userId: user.id,
      isAuthenticated: true,
    });

    logger.debug('User authenticated', { userId: user.id });
  } catch (error) {
    logger.error('Auth middleware error', { error });
    c.set('auth', { isAuthenticated: false });
  }

  return next();
}

/**
 * Require authentication
 * Returns 401 if user is not authenticated
 */
export function requireAuth(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext;

  if (!auth || !auth.isAuthenticated || !auth.userId) {
    return c.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      401
    );
  }

  return next();
}

/**
 * Optional authentication
 * Does not block if user is not authenticated
 */
export function optionalAuth(c: Context, next: Next) {
  return next();
}
