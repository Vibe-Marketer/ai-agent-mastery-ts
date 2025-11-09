/**
 * Environment variable validation schemas
 */

import { z } from 'zod';

export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // LLM Configuration
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'groq', 'mistral', 'cohere', 'ollama']),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().min(1, 'LLM API key is required'),
  LLM_MODEL: z.string().min(1, 'LLM model is required'),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().optional(),
  LLM_TOP_P: z.coerce.number().min(0).max(1).default(1.0),
  LLM_FREQUENCY_PENALTY: z.coerce.number().min(-2).max(2).default(0),
  LLM_PRESENCE_PENALTY: z.coerce.number().min(-2).max(2).default(0),
  VISION_LLM_MODEL: z.string().min(1, 'Vision LLM model is required'),

  // Embedding Configuration
  EMBEDDING_PROVIDER: z.enum(['openai', 'ollama']),
  EMBEDDING_BASE_URL: z.string().url().optional(),
  EMBEDDING_API_KEY: z.string().min(1),
  EMBEDDING_MODEL: z.string().min(1),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),

  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  DIRECT_DATABASE_URL: z.string().url().optional(),

  // Supabase
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // Web Search (optional - at least one should be provided)
  BRAVE_API_KEY: z.string().optional(),
  SEARXNG_BASE_URL: z.string().url().optional(),

  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // Asana (optional)
  ASANA_ACCESS_TOKEN: z.string().optional(),

  // Observability (optional)
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().optional(),

  // Application Configuration
  PORT: z.coerce.number().int().positive().default(8000),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  FRONTEND_PORT: z.coerce.number().int().positive().default(5173),
  ALLOWED_ORIGINS: z.string().optional(),
  CORS_ORIGINS: z.string().transform((val) => val.split(',')).default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32, 'Session secret should be at least 32 characters').optional(),

  // RAG Configuration
  RAG_WATCH_DIRECTORY: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  CHUNK_SIZE: z.coerce.number().int().positive().default(1000),
  CHUNK_OVERLAP: z.coerce.number().int().nonnegative().default(200),
  RAG_TOP_K: z.coerce.number().int().positive().default(5),
  RAG_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),

  // Memory Configuration
  ENABLE_MEMORY: z.coerce.boolean().default(true),
  MEMORY_RETENTION_DAYS: z.coerce.number().int().nonnegative().default(90),

  // Code Execution (optional, disabled by default for security)
  ENABLE_CODE_EXECUTION: z.coerce.boolean().default(false),
  CODE_EXECUTION_TIMEOUT: z.coerce.number().int().positive().default(5000),

  // Rate Limiting
  RATE_LIMIT_RPM: z.coerce.number().int().positive().default(60),
  MAX_CONCURRENT_REQUESTS: z.coerce.number().int().positive().default(10),

  // Development
  DEBUG: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_TRACING: z.coerce.boolean().default(false),
}).refine((data) => {
  // At least one search provider should be configured
  return data.BRAVE_API_KEY || data.SEARXNG_BASE_URL;
}, {
  message: 'Either BRAVE_API_KEY or SEARXNG_BASE_URL must be provided for web search',
  path: ['BRAVE_API_KEY'],
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      }).join('\n');
      throw new Error(`Environment validation failed:\n${formatted}`);
    }
    throw error;
  }
}

/**
 * Get a typed environment variable
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const env = validateEnv();
  return env[key];
}
