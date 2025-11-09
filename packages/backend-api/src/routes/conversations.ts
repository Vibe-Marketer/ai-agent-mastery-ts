/**
 * Conversation Routes
 * Handles conversation management and history
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { requireAuth, AuthContext } from '../middleware/auth.js';
import { z } from 'zod';

const conversationsRouter = new Hono();

// Request validation schemas
const createConversationSchema = z.object({
  title: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateConversationSchema = z.object({
  title: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/conversations
 * List all conversations for the user
 */
conversationsRouter.get('/', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: {
        conversations: data || [],
        total: data?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Conversation list error', { error });

    return c.json(
      {
        error: 'Failed to list conversations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/conversations
 * Create a new conversation
 */
conversationsRouter.post('/', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;

    const body = await c.req.json();
    const { title, metadata } = createConversationSchema.parse(body);

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: data,
    }, 201);
  } catch (error) {
    logger.error('Conversation create error', { error });

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
        error: 'Failed to create conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/conversations/:conversationId
 * Get conversation details and messages
 */
conversationsRouter.get('/:conversationId', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;
    const conversationId = c.req.param('conversationId');

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw msgError;
    }

    return c.json({
      success: true,
      data: {
        ...conversation,
        messages: messages || [],
      },
    });
  } catch (error) {
    logger.error('Conversation get error', { error });

    return c.json(
      {
        error: 'Failed to get conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * PATCH /api/conversations/:conversationId
 * Update conversation details
 */
conversationsRouter.patch('/:conversationId', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;
    const conversationId = c.req.param('conversationId');

    const body = await c.req.json();
    const { title, metadata } = updateConversationSchema.parse(body);

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Update
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error('Conversation update error', { error });

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
        error: 'Failed to update conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * DELETE /api/conversations/:conversationId
 * Delete a conversation and all its messages
 */
conversationsRouter.delete('/:conversationId', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;
    const conversationId = c.req.param('conversationId');

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Delete messages (cascades with ON DELETE CASCADE)
    // Delete conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    logger.error('Conversation delete error', { error });

    return c.json(
      {
        error: 'Failed to delete conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export { conversationsRouter };
