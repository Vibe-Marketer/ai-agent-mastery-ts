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

## Current Available Content

### Module 3: Prototyping with No-Code (n8n)
- Complete n8n workflows (JSON files work with both Python and TypeScript!)
- No changes needed - n8n is language-agnostic
- See original repo for workflow files

### Module 4: Building & Coding the Agent (TypeScript)
- Mastra-based agent implementation
- Complete TypeScript agent with tools and RAG
- Multi-LLM support (OpenAI, Anthropic, Ollama, Groq, Mistral, Cohere)
- RAG implementation with pgvector
- Long-term memory with custom Mem0 integration
- React UI (migrated from Streamlit)

### Module 5: Agent Application (Full UI)
- Full-stack TypeScript application
- Hono backend API with streaming SSE responses
- React + TypeScript frontend (same as original!)
- Supabase authentication & database
- Real-time conversation management

### Module 6: Agent Deployment & Production
- Docker containerization for Node.js
- CI/CD with GitHub Actions
- Multi-cloud deployment configurations
- Vercel deployment optimization
- Observability with Langfuse

### Module 7: Advanced Agent Architectures
- All 8 agent patterns implemented with LangGraph.js:
  - Agent-as-Tool
  - LLM Routing
  - Sequential Agents
  - Parallel Agents
  - Supervisor Pattern
  - Guardrail Pattern
  - Human-in-the-Loop
- Production-ready TypeScript implementations

## Project Structure

```
ai-agent-mastery-ts/
├── packages/                    # Monorepo packages
│   ├── shared/                  # Shared types, utilities
│   ├── core-agent/             # Module 4 - Core agent (Mastra)
│   ├── backend-api/            # Module 5 - Hono API server
│   ├── frontend/               # Module 5 - React UI
│   ├── rag-pipeline/           # RAG system
│   └── workflows/              # Module 7 - LangGraph.js workflows
├── scripts/                     # Build, deployment scripts
├── docker/                      # Docker configurations
└── docs/                        # Documentation
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

## Documentation

- [Setup Guide](./docs/setup.md)
- [Architecture Overview](./docs/architecture.md)
- [Migration Guide](./docs/migration-from-python.md)
- [API Reference](./docs/api-reference.md)
- [Deployment Guide](./docs/deployment.md)

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
