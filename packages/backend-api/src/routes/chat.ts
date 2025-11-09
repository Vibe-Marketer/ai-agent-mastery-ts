/**
 * Chat Routes
 * Handles chat interactions with the AI agent
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { AIAgent } from '@ai-agent-mastery/core-agent';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { requireAuth, AuthContext } from '../middleware/auth.js';
import { z } from 'zod';

const chatRouter = new Hono();

// Request validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  sessionId: z.string().optional(),
  streaming: z.boolean().optional().default(true),
});

/**
 * POST /api/chat
 * Send a message to the agent
 */
chatRouter.post('/', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;

    // Validate request body
    const body = await c.req.json();
    const { message, conversationId, sessionId, streaming } = chatRequestSchema.parse(body);

    logger.info('Chat request', { userId, message: message.substring(0, 50), streaming });

    // Initialize agent
    const env = getEnv();
    const agent = new AIAgent({
      llmProvider: env.LLM_PROVIDER,
      llmModel: env.LLM_MODEL,
      llmApiKey: env.LLM_API_KEY,
      temperature: env.LLM_TEMPERATURE,
    });

    // Streaming response
    if (streaming) {
      return stream(c, async (stream) => {
        try {
          await agent.stream({
            userId,
            message,
            conversationId,
            sessionId,
            onChunk: async (chunk) => {
              await stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
            },
          });

          await stream.write('data: [DONE]\n\n');
        } catch (error) {
          logger.error('Streaming error', { error });
          await stream.write(
            `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`
          );
        }
      });
    }

    // Non-streaming response
    const result = await agent.run({
      userId,
      message,
      conversationId,
      sessionId,
    });

    return c.json({
      success: true,
      data: {
        response: result.response,
        conversationId: result.conversationId,
        sessionId: result.sessionId,
        toolCalls: result.toolCalls,
      },
    });
  } catch (error) {
    logger.error('Chat error', { error });

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        error: 'Chat failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history
 */
chatRouter.get('/history/:conversationId', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;
    const conversationId = c.req.param('conversationId');

    // TODO: Implement conversation history retrieval from database
    // For now, return empty array

    return c.json({
      success: true,
      data: {
        conversationId,
        messages: [],
      },
    });
  } catch (error) {
    logger.error('History retrieval error', { error });

    return c.json(
      {
        error: 'Failed to retrieve history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export { chatRouter };
