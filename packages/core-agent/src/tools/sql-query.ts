/**
 * SQL Query Execution Tool
 * Execute SQL queries on document rows (CSV data)
 */

import { createClient } from '@supabase/supabase-js';
import { getEnv, logger, DatabaseError, ToolExecutionError } from '@ai-agent-mastery/shared';

interface SQLQueryInput {
  query: string;
}

/**
 * Validate SQL query for safety
 */
function validateSQLQuery(query: string): void {
  const normalized = query.toLowerCase().trim();

  // Block dangerous operations
  const forbidden = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update'];

  for (const keyword of forbidden) {
    if (normalized.includes(keyword)) {
      throw new ToolExecutionError(
        'execute_sql_query',
        `SQL query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`
      );
    }
  }

  // Must be a SELECT query
  if (!normalized.startsWith('select')) {
    throw new ToolExecutionError(
      'execute_sql_query',
      'Only SELECT queries are allowed'
    );
  }
}

/**
 * Execute SQL query via Supabase RPC
 */
async function executeSQLQuery(query: string): Promise<any[]> {
  const env = getEnv();

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase.rpc('execute_custom_sql', {
      sql_query: query,
    });

    if (error) {
      throw new DatabaseError(`SQL execution failed: ${error.message}`);
    }

    // Check if data contains an error from the function
    if (data && typeof data === 'object' && 'error' in data) {
      throw new DatabaseError(`SQL error: ${data.error}`);
    }

    return data || [];
  } catch (error) {
    logger.error('SQL query execution failed', { error, query });
    throw error;
  }
}

/**
 * Format SQL results for LLM
 */
function formatResults(results: any[]): string {
  if (results.length === 0) {
    return 'Query executed successfully. No rows returned.';
  }

  // Convert to formatted table
  const keys = Object.keys(results[0]);
  const maxRows = 50; // Limit output size

  const limitedResults = results.slice(0, maxRows);
  const hasMore = results.length > maxRows;

  const table = [
    keys.join(' | '),
    keys.map(() => '---').join(' | '),
    ...limitedResults.map(row =>
      keys.map(key => String(row[key] || '')).join(' | ')
    ),
  ].join('\n');

  const summary = `Query returned ${results.length} row(s)${hasMore ? ` (showing first ${maxRows})` : ''}:\n\n${table}`;

  return summary;
}

/**
 * SQL query execution tool implementation
 */
export async function sqlQueryTool(input: SQLQueryInput): Promise<string> {
  const { query } = input;

  logger.info('Executing SQL query', { query: query.substring(0, 100) });

  try {
    // Validate query
    validateSQLQuery(query);

    // Execute query
    const results = await executeSQLQuery(query);

    logger.info('SQL query completed', {
      rowCount: results.length,
    });

    // Format and return results
    return formatResults(results);
  } catch (error) {
    logger.error('SQL query tool failed', { error, query });
    throw error;
  }
}

/**
 * Tool definition for Mastra
 */
export const sqlQueryToolDefinition = {
  name: 'execute_sql_query',
  description: 'Execute a SQL query on tabular data (CSV files that have been processed). Only SELECT queries are allowed. Use this for data analysis, aggregations, and filtering structured data.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The SQL SELECT query to execute',
      },
    },
    required: ['query'],
  },
  execute: sqlQueryTool,
};
