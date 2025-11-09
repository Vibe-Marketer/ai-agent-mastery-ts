/**
 * Health Routes
 * Health check and status endpoints
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { getEnv, logger } from '@ai-agent-mastery/shared';

const healthRouter = new Hono();

/**
 * GET /api/health
 * Basic health check
 */
healthRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check with service status
 */
healthRouter.get('/detailed', async (c) => {
  const checks: Record<string, any> = {
    api: { status: 'ok' },
    database: { status: 'unknown' },
    llm: { status: 'unknown' },
  };

  try {
    // Check database connection
    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    if (error) {
      checks.database = { status: 'error', message: error.message };
    } else {
      checks.database = { status: 'ok' };
    }
  } catch (error) {
    logger.error('Database health check failed', { error });
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Overall status
  const allOk = Object.values(checks).every((check) => check.status === 'ok');

  return c.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

export { healthRouter };
