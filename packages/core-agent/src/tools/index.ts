/**
 * Tool Registry
 * Central registry for all agent tools
 */

import { webSearchToolDefinition } from './web-search.js';
import { ragRetrievalToolDefinition } from './rag-retrieval.js';
import { sqlQueryToolDefinition } from './sql-query.js';
import { imageAnalysisToolDefinition } from './image-analysis.js';
import { codeExecutionToolDefinition } from './code-execution.js';

export * from './web-search.js';
export * from './rag-retrieval.js';
export * from './sql-query.js';
export * from './image-analysis.js';
export * from './code-execution.js';

/**
 * All available tools
 */
export const ALL_TOOLS = {
  web_search: webSearchToolDefinition,
  retrieve_relevant_documents: ragRetrievalToolDefinition,
  execute_sql_query: sqlQueryToolDefinition,
  image_analysis: imageAnalysisToolDefinition,
  execute_safe_code: codeExecutionToolDefinition,
};

/**
 * Get tool by name
 */
export function getTool(name: string) {
  return ALL_TOOLS[name as keyof typeof ALL_TOOLS];
}

/**
 * Get tools by names
 */
export function getTools(names: string[]) {
  return names
    .map(name => getTool(name))
    .filter(tool => tool !== undefined);
}

/**
 * Get all tool names
 */
export function getAllToolNames(): string[] {
  return Object.keys(ALL_TOOLS);
}
