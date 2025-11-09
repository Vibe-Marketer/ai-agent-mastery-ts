/**
 * Web Search Tool
 * Supports Brave Search API and SearXNG
 */

import { getEnv, logger, ExternalServiceError, ToolExecutionError } from '@ai-agent-mastery/shared';

interface WebSearchInput {
  query: string;
}

interface WebSearchResult {
  summary: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

/**
 * Search using Brave Search API
 */
async function searchWithBrave(query: string, apiKey: string): Promise<WebSearchResult> {
  try {
    const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      // @ts-ignore
      params: {
        q: query,
        count: 5,
      },
    });

    if (!response.ok) {
      throw new ExternalServiceError('Brave', `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract and format results
    const sources = data.web?.results?.slice(0, 5).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
    })) || [];

    // Use Brave's AI summary if available, otherwise create summary from results
    const summary = data.summarizer?.key ||
      sources.map((s: any) => `${s.title}: ${s.snippet}`).join('\n\n');

    return { summary, sources };
  } catch (error) {
    logger.error('Brave search failed', { error, query });
    throw new ExternalServiceError('Brave', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Search using SearXNG
 */
async function searchWithSearXNG(query: string, baseUrl: string): Promise<WebSearchResult> {
  try {
    const url = new URL('/search', baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('engines', 'google,bing,duckduckgo');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new ExternalServiceError('SearXNG', `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const sources = data.results?.slice(0, 5).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content || result.title,
    })) || [];

    // Create summary from top results
    const summary = sources
      .map((s: any, i: number) => `${i + 1}. ${s.title}\n${s.snippet}\nSource: ${s.url}`)
      .join('\n\n');

    return { summary, sources };
  } catch (error) {
    logger.error('SearXNG search failed', { error, query });
    throw new ExternalServiceError('SearXNG', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Web search tool implementation
 */
export async function webSearchTool(input: WebSearchInput): Promise<string> {
  const { query } = input;
  const env = getEnv();

  logger.info('Executing web search', { query });

  try {
    let result: WebSearchResult;

    if (env.BRAVE_API_KEY) {
      logger.debug('Using Brave Search API');
      result = await searchWithBrave(query, env.BRAVE_API_KEY);
    } else if (env.SEARXNG_BASE_URL) {
      logger.debug('Using SearXNG');
      result = await searchWithSearXNG(query, env.SEARXNG_BASE_URL);
    } else {
      throw new ToolExecutionError(
        'web_search',
        'No search provider configured. Set BRAVE_API_KEY or SEARXNG_BASE_URL'
      );
    }

    logger.info('Web search completed', {
      query,
      resultsCount: result.sources?.length || 0
    });

    return result.summary;
  } catch (error) {
    logger.error('Web search tool failed', { error, query });
    throw error;
  }
}

/**
 * Tool definition for Mastra
 */
export const webSearchToolDefinition = {
  name: 'web_search',
  description: 'Search the web with a specific query and get a summary of the top search results. Use this for current events, news, or information not in the knowledge base.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
  execute: webSearchTool,
};
