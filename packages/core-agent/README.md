# @ai-agent-mastery/core-agent

Core AI agent implementation using the Mastra framework. This package provides the main agent logic, tools, and memory systems.

## Features

- 🤖 **Multi-LLM Support** - OpenAI, Anthropic, Groq, Ollama
- 🔧 **Tool System** - Web search, RAG, SQL, image analysis, code execution
- 🧠 **Memory** - Long-term memory with semantic search
- 📊 **Streaming** - Real-time response streaming
- 🔒 **Type-Safe** - Full TypeScript support with Zod validation

## Installation

```bash
pnpm install
```

## Quick Start

```typescript
import { createAgent } from '@ai-agent-mastery/core-agent';
import { getEnv } from '@ai-agent-mastery/shared';

// Create agent
const agent = createAgent({
  model: getEnv().LLM_MODEL,
  provider: getEnv().LLM_PROVIDER,
  tools: ['web_search', 'rag_retrieval'],
  enableMemory: true,
});

// Run agent
const result = await agent.run({
  message: 'What is the weather in Tokyo?',
  context: {
    userId: 'user-123',
    conversationId: 'conv-456',
  },
});

console.log(result.message);
```

## Available Tools

### Search & Retrieval
- **web_search** - Search the web using Brave API or SearXNG
- **rag_retrieval** - Semantic search over uploaded documents
- **list_documents** - List all documents in knowledge base
- **get_document_content** - Get full document content

### Data & Analysis
- **sql_query** - Execute SQL on tabular data (CSV files)
- **code_execution** - Run Python code in sandbox (optional)

### Vision
- **image_analysis** - Analyze images with vision models

### Memory
- **recall_memories** - Retrieve relevant past information
- **store_memory** - Save important information

## Configuration

### Environment Variables

```env
# LLM Configuration
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_key

# Embedding Model
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_KEY=your_key

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Optional: Web Search
BRAVE_API_KEY=your_brave_key
# OR
SEARXNG_BASE_URL=http://localhost:8081

# Optional: Code Execution (disabled by default)
ENABLE_CODE_EXECUTION=false
```

### Agent Configuration

```typescript
interface AgentConfig {
  model: string;              // LLM model name
  provider: LLMProvider;      // openai, anthropic, groq, ollama
  tools: string[];            // Tool names to enable
  temperature?: number;       // 0-2 (default: 0.7)
  maxSteps?: number;          // Max tool calls (default: 10)
  enableMemory?: boolean;     // Enable long-term memory (default: true)
  systemPrompt?: string;      // Custom system prompt
}
```

## Tools

### Web Search Tool

Search the web and get summarized results:

```typescript
const result = await agent.tools.web_search.execute({
  query: 'latest news on AI',
});
```

### RAG Retrieval Tool

Semantic search over your documents:

```typescript
const result = await agent.tools.rag_retrieval.execute({
  query: 'company benefits policy',
  topK: 5,
  threshold: 0.7,
});
```

### SQL Query Tool

Execute SQL on CSV data:

```typescript
const result = await agent.tools.sql_query.execute({
  query: 'SELECT * FROM sales WHERE amount > 1000',
});
```

### Image Analysis Tool

Analyze images with vision models:

```typescript
const result = await agent.tools.image_analysis.execute({
  imageUrl: 'https://example.com/image.jpg',
  question: 'What is in this image?',
});
```

## Memory System

The agent maintains long-term memory of user interactions:

```typescript
// Memories are automatically stored during conversations
const result = await agent.run({
  message: 'My favorite color is blue',
  context: { userId: 'user-123', conversationId: 'conv-456' },
});

// Later, the agent recalls this information
const result2 = await agent.run({
  message: 'What is my favorite color?',
  context: { userId: 'user-123', conversationId: 'conv-789' },
});
// Response: "Your favorite color is blue."
```

## Streaming Responses

Stream tokens as they're generated:

```typescript
const stream = await agent.stream({
  message: 'Write a long essay about AI',
  context: { userId: 'user-123', conversationId: 'conv-456' },
});

for await (const chunk of stream) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.content);
  }
}
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint
pnpm lint:fix
```

## Architecture

```
core-agent/
├── agent/
│   ├── config.ts          # Agent configuration
│   ├── agent.ts           # Main agent implementation
│   └── streaming.ts       # Streaming utilities
├── tools/
│   ├── web-search.ts      # Web search tool
│   ├── rag-retrieval.ts   # RAG retrieval tool
│   ├── sql-query.ts       # SQL execution tool
│   ├── image-analysis.ts  # Image analysis tool
│   ├── code-execution.ts  # Code execution tool
│   └── index.ts           # Tool registry
├── memory/
│   ├── mem0.ts            # Memory implementation
│   └── index.ts           # Memory exports
└── index.ts               # Package exports
```

## Examples

See the [examples directory](../../examples) for complete usage examples.

## License

MIT
