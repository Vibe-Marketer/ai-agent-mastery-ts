# AI Agent Mastery Course - TypeScript Edition

This repository contains a complete TypeScript implementation of the [AI Agent Mastery course](https://community.dynamous.ai/s/ai-mastery-course/). This is a modern, type-safe reimagining of the course using TypeScript, Mastra, LangGraph.js, and the Vercel AI SDK.

> **Note:** This is a TypeScript port of the original Python-based course. The original repository can be found at [dynamous-community/ai-agent-mastery](https://github.com/dynamous-community/ai-agent-mastery).

## Why TypeScript?

This version provides:
- 🎯 **Type Safety** - Catch errors at compile time, not runtime
- 🚀 **Modern Tooling** - Leverage the JavaScript/TypeScript ecosystem
- 🔄 **Edge Runtime Compatible** - Deploy to Vercel, Cloudflare Workers, etc.
- 💻 **Full-Stack TypeScript** - Single language from frontend to backend
- 🌐 **Lovable.dev Compatible** - Works seamlessly with modern no-code tools

## Tech Stack

- **Agent Framework**: Mastra + Vercel AI SDK
- **Workflow Orchestration**: LangGraph.js
- **Backend API**: Hono (fast, edge-compatible)
- **Frontend**: React + TypeScript + Vite (same as original!)
- **Validation**: Zod (TypeScript's Pydantic)
- **Database**: PostgreSQL + pgvector (via Supabase)
- **Deployment**: Docker, Vercel, Cloudflare

## Packages

This monorepo contains the following packages:

### Core Packages

#### `@ai-agent-mastery/shared`
Shared utilities, types, schemas, and constants used across all packages.
- Environment variable validation with Zod
- Type definitions for LLMs, messages, tools
- Logger, error handlers, database schemas
- Model configurations and pricing info

#### `@ai-agent-mastery/core-agent` (Module 4)
Main AI agent implementation using Mastra framework.
- Multi-LLM support (OpenAI, Anthropic, Ollama, Groq, Mistral, Cohere)
- 5 core tools: Web Search, RAG Retrieval, SQL Query, Image Analysis, Code Execution
- Long-term memory system (Mem0-like)
- Streaming and non-streaming modes
- Complete TypeScript agent ready for production

#### `@ai-agent-mastery/rag-pipeline` (Module 4)
Document processing and RAG system.
- Extract text from PDF, DOCX, Markdown, CSV, JSON
- Text chunking with configurable overlap
- Embedding generation with OpenAI-compatible APIs
- Local file watching with chokidar
- Google Drive integration
- PostgreSQL + pgvector storage
- CLI for batch processing

#### `@ai-agent-mastery/backend-api` (Module 5)
RESTful API server built with Hono.
- Fast, edge-compatible web framework
- Supabase authentication
- SSE streaming for real-time responses
- Chat, documents, conversations endpoints
- CORS, logging, error handling middleware
- Ready for Vercel, Cloudflare Workers

#### `@ai-agent-mastery/langgraph-workflows` (Module 7)
Advanced multi-agent patterns with LangGraph.js.
- **Multi-Agent Intro**: Basic collaboration (research → writer)
- **Guardrail**: Content moderation and safety checks
- **LLM Routing**: Intent-based routing to specialized agents
- **Sequential Agents**: Pipeline processing (planner → drafter → editor)
- **Parallel Agents**: Concurrent work with synthesis
- **Supervisor**: Central coordinator managing workers
- **Human-in-the-Loop**: Interactive approval workflows
- All patterns production-ready and fully typed

## Project Structure

```
ai-agent-mastery-ts/
├── packages/                          # Monorepo packages
│   ├── shared/                        # Shared utilities, types, schemas
│   │   ├── src/
│   │   │   ├── types/                 # TypeScript interfaces
│   │   │   ├── schemas/               # Zod validation schemas
│   │   │   ├── utils/                 # Utility functions
│   │   │   └── constants/             # Model configs, pricing
│   │   └── package.json
│   │
│   ├── core-agent/                    # Module 4 - AI Agent
│   │   ├── src/
│   │   │   ├── tools/                 # 5 core tools
│   │   │   ├── memory/                # Long-term memory (Mem0)
│   │   │   └── agent/                 # Main AIAgent class
│   │   └── package.json
│   │
│   ├── rag-pipeline/                  # Module 4 - RAG System
│   │   ├── src/
│   │   │   ├── processors/            # Text extraction
│   │   │   ├── uploader/              # Database operations
│   │   │   ├── watcher/               # File monitoring
│   │   │   └── cli.ts                 # CLI tool
│   │   └── package.json
│   │
│   ├── backend-api/                   # Module 5 - API Server
│   │   ├── src/
│   │   │   ├── middleware/            # Auth, CORS, logging
│   │   │   ├── routes/                # API endpoints
│   │   │   ├── app.ts                 # Hono app setup
│   │   │   └── server.ts              # Server entry point
│   │   └── package.json
│   │
│   └── langgraph-workflows/           # Module 7 - Multi-Agent
│       ├── src/
│       │   ├── workflows/             # 7 agent patterns
│       │   │   ├── 01-multi-agent-intro.ts
│       │   │   ├── 02-guardrail.ts
│       │   │   ├── 03-llm-routing.ts
│       │   │   ├── 04-sequential-agents.ts
│       │   │   ├── 05-parallel-agents.ts
│       │   │   ├── 06-supervisor-agent.ts
│       │   │   └── 07-human-in-loop.ts
│       │   └── utils/                 # LLM factory
│       └── package.json
│
├── database/                          # Database schemas
│   ├── schemas/                       # SQL migration files
│   └── README.md
│
├── docker/                            # Docker configurations
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .github/                           # GitHub Actions CI/CD
│   └── workflows/
│
├── turbo.json                         # Turborepo configuration
├── pnpm-workspace.yaml                # Workspace configuration
└── package.json                       # Root package.json
```

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 8+ (or npm/yarn)
- PostgreSQL 15+ with pgvector extension (or Supabase account)
- API keys for LLM providers (OpenAI, Anthropic, etc.)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Vibe-Marketer/ai-agent-mastery-ts.git
cd ai-agent-mastery-ts
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Initialize database**
```bash
pnpm db:setup
```

5. **Start development server**
```bash
pnpm dev
```

## Development Workflow

```bash
# Install all dependencies
pnpm install

# Run all packages in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Migration from Python Version

This TypeScript version maintains functional parity with the Python original while leveraging TypeScript's advantages:

| Python | TypeScript Equivalent |
|--------|----------------------|
| Pydantic AI | Mastra + Vercel AI SDK |
| LangGraph | LangGraph.js |
| FastAPI | Hono |
| Pydantic | Zod |
| Streamlit | React (same as Module 5) |
| uvicorn | Built into Node.js |
| Supabase-py | @supabase/supabase-js |
| pytest | Vitest |

## Package Documentation

Each package has its own README with detailed usage instructions:

- [`@ai-agent-mastery/shared`](./packages/shared/README.md) - Shared utilities and types
- [`@ai-agent-mastery/core-agent`](./packages/core-agent/README.md) - AI agent with tools and memory
- [`@ai-agent-mastery/rag-pipeline`](./packages/rag-pipeline/README.md) - Document processing and RAG
- [`@ai-agent-mastery/backend-api`](./packages/backend-api/README.md) - RESTful API server
- [`@ai-agent-mastery/langgraph-workflows`](./packages/langgraph-workflows/README.md) - Multi-agent patterns

## Database Setup

The database schemas are located in the [`database/`](./database/) directory:

```bash
# Using Supabase (recommended)
# 1. Create a new project at https://supabase.com
# 2. Run the SQL migrations from database/schemas/
# 3. Enable pgvector extension
# 4. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env

# Using local PostgreSQL
psql -U postgres -d your_database -f database/schemas/00-complete-schema.sql
```

## Contributing

This is an educational project. Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Acknowledgments

- Original Python course by [Dynamous](https://dynamous.ai)
- Built with [Mastra](https://mastra.ai)
- Powered by [LangGraph.js](https://langchain-ai.github.io/langgraphjs/)
- UI toolkit by [shadcn/ui](https://ui.shadcn.com)

## Support

- [GitHub Issues](https://github.com/Vibe-Marketer/ai-agent-mastery-ts/issues)
- [Original Course Community](https://community.dynamous.ai)

---

**Note:** This is a community-driven TypeScript port. For the official Python version, visit [dynamous-community/ai-agent-mastery](https://github.com/dynamous-community/ai-agent-mastery).
