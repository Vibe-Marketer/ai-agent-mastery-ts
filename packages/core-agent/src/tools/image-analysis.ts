/**
 * Image Analysis Tool
 * Analyze images using vision-capable LLMs
 */

import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { getEnv, logger, LLMProviderError, ToolExecutionError } from '@ai-agent-mastery/shared';

interface ImageAnalysisInput {
  imageUrl: string;
  question?: string;
}

/**
 * Analyze image with OpenAI
 */
async function analyzeWithOpenAI(imageUrl: string, question: string): Promise<string> {
  const env = getEnv();

  try {
    const openai = new OpenAI({
      apiKey: env.LLM_API_KEY,
      baseURL: env.LLM_BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: env.VISION_LLM_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: question,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'No response from model';
  } catch (error) {
    logger.error('OpenAI image analysis failed', { error, imageUrl });
    throw new LLMProviderError('OpenAI', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Analyze image with Anthropic Claude
 */
async function analyzeWithAnthropic(imageUrl: string, question: string): Promise<string> {
  const env = getEnv();

  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Determine media type from URL or response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mediaType = contentType.split('/')[1] as 'jpeg' | 'png' | 'gif' | 'webp';

    const anthropic = new Anthropic({
      apiKey: env.LLM_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: env.VISION_LLM_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${mediaType}`,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: question,
            },
          ],
        },
      ],
    });

    const textContent = message.content.find(block => block.type === 'text');
    return textContent && 'text' in textContent ? textContent.text : 'No response from model';
  } catch (error) {
    logger.error('Anthropic image analysis failed', { error, imageUrl });
    throw new LLMProviderError('Anthropic', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Image analysis tool implementation
 */
export async function imageAnalysisTool(input: ImageAnalysisInput): Promise<string> {
  const { imageUrl, question = 'What do you see in this image? Provide a detailed description.' } = input;
  const env = getEnv();

  logger.info('Executing image analysis', { imageUrl, question });

  try {
    let result: string;

    if (env.LLM_PROVIDER === 'openai' || env.LLM_PROVIDER === 'groq' || env.LLM_PROVIDER === 'ollama') {
      logger.debug('Using OpenAI-compatible vision model');
      result = await analyzeWithOpenAI(imageUrl, question);
    } else if (env.LLM_PROVIDER === 'anthropic') {
      logger.debug('Using Anthropic Claude vision model');
      result = await analyzeWithAnthropic(imageUrl, question);
    } else {
      throw new ToolExecutionError(
        'image_analysis',
        `Vision not supported for provider: ${env.LLM_PROVIDER}`
      );
    }

    logger.info('Image analysis completed', {
      imageUrl,
      responseLength: result.length,
    });

    return result;
  } catch (error) {
    logger.error('Image analysis tool failed', { error, imageUrl });
    throw error;
  }
}

/**
 * Tool definition for Mastra
 */
export const imageAnalysisToolDefinition = {
  name: 'image_analysis',
  description: 'Analyze an image and answer questions about it using a vision-capable LLM. Provide the image URL and optionally a specific question.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'The URL of the image to analyze',
      },
      question: {
        type: 'string',
        description: 'The question to ask about the image (optional)',
      },
    },
    required: ['imageUrl'],
  },
  execute: imageAnalysisTool,
};
