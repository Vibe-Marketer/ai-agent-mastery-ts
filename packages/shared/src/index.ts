/**
 * @ai-agent-mastery/shared
 * Shared types, schemas, utilities, and constants for AI Agent Mastery
 */

// Types
export * from './types/index.js';

// Schemas (Zod validation) - explicitly export to avoid conflicts
export { llmConfigSchema, messageSchema, toolCallSchema } from './schemas/llm.js';
export { agentConfigSchema, agentOutputSchema } from './schemas/agent.js';
export {
  documentSchema,
  chunkingStrategySchema,
  vectorSearchQuerySchema,
  vectorSearchResultSchema,
  ragContextSchema,
} from './schemas/rag.js';
export {
  chatRequestSchema,
  chatResponseSchema,
  streamingChatChunkSchema,
  conversationListParamsSchema,
} from './schemas/conversation.js';
export { envSchema } from './schemas/env.js';

// Utilities
export { getEnv } from './utils/env.js';
export { logger } from './utils/logger.js';
export * from './utils/errors.js';
export * from './utils/format.js';
export * from './utils/validation.js';

// Constants
export * from './constants/index.js';
