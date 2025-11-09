/**
 * Tool names and descriptions constants
 */

/**
 * Standard tool names used across the application
 */
export const TOOL_NAMES = {
  WEB_SEARCH: 'web_search',
  RAG_RETRIEVAL: 'retrieve_relevant_documents',
  LIST_DOCUMENTS: 'list_documents',
  GET_DOCUMENT_CONTENT: 'get_document_content',
  SQL_QUERY: 'execute_sql_query',
  CODE_EXECUTION: 'execute_safe_code',
  IMAGE_ANALYSIS: 'image_analysis',
  MEMORY_RECALL: 'recall_memories',
  MEMORY_STORE: 'store_memory',
  EMAIL_SEND: 'send_email',
  EMAIL_READ: 'read_emails',
  CALENDAR_READ: 'read_calendar',
  CALENDAR_CREATE: 'create_calendar_event',
  TASK_CREATE: 'create_task',
  TASK_LIST: 'list_tasks',
  TASK_UPDATE: 'update_task',
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/**
 * Tool categories for organization
 */
export const TOOL_CATEGORIES = {
  SEARCH: 'search',
  RAG: 'rag',
  DATABASE: 'database',
  COMPUTATION: 'computation',
  VISION: 'vision',
  MEMORY: 'memory',
  COMMUNICATION: 'communication',
  PRODUCTIVITY: 'productivity',
} as const;

/**
 * Tool metadata
 */
export interface ToolMetadata {
  name: ToolName;
  category: (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];
  description: string;
  requiresAuth?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Standard tool metadata
 */
export const TOOL_METADATA: Record<ToolName, ToolMetadata> = {
  [TOOL_NAMES.WEB_SEARCH]: {
    name: TOOL_NAMES.WEB_SEARCH,
    category: TOOL_CATEGORIES.SEARCH,
    description: 'Search the web with a specific query and get a summary of the top search results',
    riskLevel: 'low',
  },
  [TOOL_NAMES.RAG_RETRIEVAL]: {
    name: TOOL_NAMES.RAG_RETRIEVAL,
    category: TOOL_CATEGORIES.RAG,
    description: 'Retrieve relevant document chunks based on the query using RAG (Retrieval Augmented Generation)',
    riskLevel: 'low',
  },
  [TOOL_NAMES.LIST_DOCUMENTS]: {
    name: TOOL_NAMES.LIST_DOCUMENTS,
    category: TOOL_CATEGORIES.RAG,
    description: 'List all available documents in the knowledge base',
    riskLevel: 'low',
  },
  [TOOL_NAMES.GET_DOCUMENT_CONTENT]: {
    name: TOOL_NAMES.GET_DOCUMENT_CONTENT,
    category: TOOL_CATEGORIES.RAG,
    description: 'Get the full content of a specific document by ID',
    riskLevel: 'low',
  },
  [TOOL_NAMES.SQL_QUERY]: {
    name: TOOL_NAMES.SQL_QUERY,
    category: TOOL_CATEGORIES.DATABASE,
    description: 'Execute a SQL query on tabular data (CSV files converted to SQL tables)',
    riskLevel: 'medium',
  },
  [TOOL_NAMES.CODE_EXECUTION]: {
    name: TOOL_NAMES.CODE_EXECUTION,
    category: TOOL_CATEGORIES.COMPUTATION,
    description: 'Execute Python code in a sandboxed environment for calculations and data analysis',
    riskLevel: 'high',
  },
  [TOOL_NAMES.IMAGE_ANALYSIS]: {
    name: TOOL_NAMES.IMAGE_ANALYSIS,
    category: TOOL_CATEGORIES.VISION,
    description: 'Analyze an image and answer questions about it using a vision-capable LLM',
    riskLevel: 'low',
  },
  [TOOL_NAMES.MEMORY_RECALL]: {
    name: TOOL_NAMES.MEMORY_RECALL,
    category: TOOL_CATEGORIES.MEMORY,
    description: 'Recall relevant memories from previous conversations with the user',
    riskLevel: 'low',
  },
  [TOOL_NAMES.MEMORY_STORE]: {
    name: TOOL_NAMES.MEMORY_STORE,
    category: TOOL_CATEGORIES.MEMORY,
    description: 'Store important information from the conversation for future recall',
    riskLevel: 'low',
  },
  [TOOL_NAMES.EMAIL_SEND]: {
    name: TOOL_NAMES.EMAIL_SEND,
    category: TOOL_CATEGORIES.COMMUNICATION,
    description: 'Send an email via Gmail',
    requiresAuth: true,
    riskLevel: 'high',
  },
  [TOOL_NAMES.EMAIL_READ]: {
    name: TOOL_NAMES.EMAIL_READ,
    category: TOOL_CATEGORIES.COMMUNICATION,
    description: 'Read recent emails from Gmail inbox',
    requiresAuth: true,
    riskLevel: 'medium',
  },
  [TOOL_NAMES.CALENDAR_READ]: {
    name: TOOL_NAMES.CALENDAR_READ,
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    description: 'Read upcoming calendar events from Google Calendar',
    requiresAuth: true,
    riskLevel: 'low',
  },
  [TOOL_NAMES.CALENDAR_CREATE]: {
    name: TOOL_NAMES.CALENDAR_CREATE,
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    description: 'Create a new event in Google Calendar',
    requiresAuth: true,
    riskLevel: 'medium',
  },
  [TOOL_NAMES.TASK_CREATE]: {
    name: TOOL_NAMES.TASK_CREATE,
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    description: 'Create a new task in Asana',
    requiresAuth: true,
    riskLevel: 'medium',
  },
  [TOOL_NAMES.TASK_LIST]: {
    name: TOOL_NAMES.TASK_LIST,
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    description: 'List tasks from Asana project',
    requiresAuth: true,
    riskLevel: 'low',
  },
  [TOOL_NAMES.TASK_UPDATE]: {
    name: TOOL_NAMES.TASK_UPDATE,
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    description: 'Update an existing task in Asana',
    requiresAuth: true,
    riskLevel: 'medium',
  },
};

/**
 * Get tools by category
 */
export function getToolsByCategory(category: (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES]): ToolMetadata[] {
  return Object.values(TOOL_METADATA).filter((tool) => tool.category === category);
}

/**
 * Get tools by risk level
 */
export function getToolsByRiskLevel(riskLevel: 'low' | 'medium' | 'high'): ToolMetadata[] {
  return Object.values(TOOL_METADATA).filter((tool) => tool.riskLevel === riskLevel);
}

/**
 * Get tools that require authentication
 */
export function getAuthRequiredTools(): ToolMetadata[] {
  return Object.values(TOOL_METADATA).filter((tool) => tool.requiresAuth);
}
