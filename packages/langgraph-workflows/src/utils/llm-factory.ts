/**
 * LLM Factory
 * Creates LangChain LLM instances based on provider
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getEnv, logger } from '@ai-agent-mastery/shared';

export interface LLMOptions {
  provider?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

/**
 * Create an LLM instance based on provider
 */
export function createLLM(options: LLMOptions = {}): BaseChatModel {
  const env = getEnv();

  const provider = options.provider || env.LLM_PROVIDER;
  const model = options.model || env.LLM_MODEL;
  const apiKey = options.apiKey || env.LLM_API_KEY;
  const temperature = options.temperature ?? env.LLM_TEMPERATURE ?? 0.7;
  const maxTokens = options.maxTokens ?? env.LLM_MAX_TOKENS;
  const streaming = options.streaming ?? true;

  logger.debug('Creating LLM', { provider, model, temperature });

  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        modelName: model,
        openAIApiKey: apiKey,
        temperature,
        maxTokens,
        streaming,
      });

    case 'anthropic':
      return new ChatAnthropic({
        modelName: model,
        anthropicApiKey: apiKey,
        temperature,
        maxTokens,
        streaming,
      });

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
