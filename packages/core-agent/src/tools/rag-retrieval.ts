/**
 * RAG Retrieval Tool
 * Semantic search over documents using pgvector
 */

import { createClient } from '@supabase/supabase-js';
import { getEnv, logger, DatabaseError, ToolExecutionError } from '@ai-agent-mastery/shared';
import OpenAI from 'openai';

interface RAGRetrievalInput {
  query: string;
  topK?: number;
  threshold?: number;
}

interface DocumentChunk {
  id: number;
  content: string;
  metadata: {
    source?: string;
    filename?: string;
    [key: string]: any;
  };
  similarity: number;
}

/**
 * Generate embedding for query
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const env = getEnv();

  try {
    const openai = new OpenAI({
      apiKey: env.EMBEDDING_API_KEY,
      baseURL: env.EMBEDDING_BASE_URL,
    });

    const response = await openai.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error('Embedding generation failed', { error, text });
    throw new ToolExecutionError('rag_retrieval', 'Failed to generate embedding');
  }
}

/**
 * Search documents using vector similarity
 */
async function searchDocuments(
  embedding: number[],
  topK: number,
  threshold: number
): Promise<DocumentChunk[]> {
  const env = getEnv();

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: topK,
      filter: {},
    });

    if (error) {
      throw new DatabaseError(`Vector search failed: ${error.message}`);
    }

    // Filter by similarity threshold
    const filtered = (data || []).filter((doc: any) => doc.similarity >= threshold);

    return filtered.map((doc: any) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata || {},
      similarity: doc.similarity,
    }));
  } catch (error) {
    logger.error('Document search failed', { error });
    throw error;
  }
}

/**
 * Format search results for LLM
 */
function formatResults(chunks: DocumentChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant documents found in the knowledge base.';
  }

  const formatted = chunks.map((chunk, index) => {
    const filename = chunk.metadata.filename || chunk.metadata.source || 'Unknown';
    const similarity = (chunk.similarity * 100).toFixed(1);

    return `
Document ${index + 1} (${filename}, relevance: ${similarity}%):
${chunk.content}
`.trim();
  });

  return `Found ${chunks.length} relevant document(s):\n\n${formatted.join('\n\n---\n\n')}`;
}

/**
 * RAG retrieval tool implementation
 */
export async function ragRetrievalTool(input: RAGRetrievalInput): Promise<string> {
  const { query, topK = 4, threshold = 0.7 } = input;
  const env = getEnv();

  logger.info('Executing RAG retrieval', { query, topK, threshold });

  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query);

    // Search documents
    const results = await searchDocuments(embedding, topK, threshold);

    logger.info('RAG retrieval completed', {
      query,
      resultsFound: results.length,
      topSimilarity: results[0]?.similarity || 0,
    });

    // Format and return results
    return formatResults(results);
  } catch (error) {
    logger.error('RAG retrieval tool failed', { error, query });
    throw error;
  }
}

/**
 * Tool definition for Mastra
 */
export const ragRetrievalToolDefinition = {
  name: 'retrieve_relevant_documents',
  description: 'Retrieve relevant document chunks based on the query using RAG (Retrieval Augmented Generation). Use this to search through uploaded documents, files, and knowledge base content.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or question',
      },
      topK: {
        type: 'number',
        description: 'Number of top results to return (default: 4)',
        default: 4,
      },
      threshold: {
        type: 'number',
        description: 'Minimum similarity threshold 0-1 (default: 0.7)',
        default: 0.7,
      },
    },
    required: ['query'],
  },
  execute: ragRetrievalTool,
};
