/**
 * Memory System (Mem0-like implementation)
 * Long-term memory for agent conversations
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getEnv, logger, DatabaseError } from '@ai-agent-mastery/shared';

interface Memory {
  id: string;
  userId: string;
  conversationId?: string;
  content: string;
  importance: number;
  embedding?: number[];
  createdAt: Date;
  expiresAt?: Date;
}

interface AddMemoryInput {
  userId: string;
  conversationId?: string;
  content: string;
  importance?: number;
}

interface SearchMemoriesInput {
  userId: string;
  query: string;
  topK?: number;
  threshold?: number;
}

/**
 * Generate embedding for memory
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const env = getEnv();

  const openai = new OpenAI({
    apiKey: env.EMBEDDING_API_KEY,
    baseURL: env.EMBEDDING_BASE_URL,
  });

  const response = await openai.embeddings.create({
    model: env.EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Add a memory to the store
 */
export async function addMemory(input: AddMemoryInput): Promise<string> {
  const { userId, conversationId, content, importance = 0.5 } = input;
  const env = getEnv();

  logger.info('Adding memory', { userId, conversationId, importance });

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Calculate expiration (90 days default)
    const retentionDays = env.MEMORY_RETENTION_DAYS;
    const expiresAt = retentionDays > 0
      ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Store memory (we'll need to create a memories table)
    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        content,
        importance,
        embedding,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to store memory: ${error.message}`);
    }

    logger.info('Memory stored', { memoryId: data.id });
    return data.id;
  } catch (error) {
    logger.error('Failed to add memory', { error, userId });
    throw error;
  }
}

/**
 * Search memories using semantic similarity
 */
export async function searchMemories(input: SearchMemoriesInput): Promise<Memory[]> {
  const { userId, query, topK = 5, threshold = 0.7 } = input;
  const env = getEnv();

  logger.info('Searching memories', { userId, query, topK });

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search using vector similarity (would need custom RPC function)
    const { data, error } = await supabase.rpc('search_memories', {
      user_id: userId,
      query_embedding: queryEmbedding,
      match_count: topK,
      similarity_threshold: threshold,
    });

    if (error) {
      throw new DatabaseError(`Memory search failed: ${error.message}`);
    }

    const memories: Memory[] = (data || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      conversationId: m.conversation_id,
      content: m.content,
      importance: m.importance,
      embedding: m.embedding,
      createdAt: new Date(m.created_at),
      expiresAt: m.expires_at ? new Date(m.expires_at) : undefined,
    }));

    logger.info('Memory search completed', {
      userId,
      resultsFound: memories.length,
    });

    return memories;
  } catch (error) {
    logger.error('Failed to search memories', { error, userId, query });
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Format memories for LLM context
 */
export function formatMemories(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'No relevant memories found.';
  }

  const formatted = memories.map((memory, index) => {
    const age = Math.floor((Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return `Memory ${index + 1} (${age} days ago, importance: ${(memory.importance * 100).toFixed(0)}%):\n${memory.content}`;
  });

  return `Relevant memories:\n\n${formatted.join('\n\n')}`;
}

/**
 * Extract and store important information from conversation
 */
export async function extractAndStoreMemories(
  userId: string,
  conversationId: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  // This would use an LLM to extract important facts from the conversation
  // For now, we'll use a simple heuristic - store user statements as memories

  logger.info('Extracting memories from conversation', { userId, conversationId, messageCount: messages.length });

  const userMessages = messages.filter(m => m.role === 'user');

  for (const message of userMessages) {
    // Simple heuristic: if message contains certain keywords, store as memory
    const keywords = ['my', 'i am', 'i like', 'i prefer', 'remember', 'favorite'];
    const hasKeyword = keywords.some(k => message.content.toLowerCase().includes(k));

    if (hasKeyword && message.content.length > 10) {
      try {
        await addMemory({
          userId,
          conversationId,
          content: message.content,
          importance: 0.6, // Medium importance
        });
      } catch (error) {
        logger.error('Failed to store conversation memory', { error, message: message.content });
      }
    }
  }
}
