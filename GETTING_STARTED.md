# Getting Started with AI Agent Mastery TypeScript

Welcome! This guide will help you get started with the TypeScript version of AI Agent Mastery.

## 🎯 What We've Built So Far

This is a **work-in-progress migration** from Python to TypeScript. We've completed the foundation (Phase 1 - ~5% complete):

### ✅ Completed
- Monorepo structure with pnpm workspaces
- TypeScript configuration
- Build tooling (Turborepo, ESLint, Prettier)
- Environment configuration template
- Shared type definitions (LLM, Agent types)
- Git repository initialized
- GitHub repository created

### 🚧 In Progress
- Complete shared types (RAG, Database, Conversation)
- Database schema setup
- Docker configuration

### ⏸️ Not Started Yet
- Core agent implementation (Mastra)
- Backend API (Hono)
- Frontend integration
- RAG pipeline
- LangGraph workflows
- Deployment configurations

## 📁 Project Structure

```
ai-agent-mastery-ts/
├── packages/
│   ├── shared/         # Shared types and utilities
│   ├── core-agent/     # Core agent framework (Module 4)
│   ├── backend-api/    # Hono API server (Module 5)
│   ├── frontend/       # React UI (Module 5)
│   ├── rag-pipeline/   # RAG system
│   └── workflows/      # LangGraph.js workflows (Module 7)
├── scripts/            # Build and deployment scripts
├── docker/             # Docker configurations
├── docs/               # Documentation
├── .env.example        # Environment variables template
├── package.json        # Root package.json
├── pnpm-workspace.yaml # pnpm workspace config
├── turbo.json          # Turborepo config
└── tsconfig.json       # TypeScript config
```

## 🚀 Quick Start

### Prerequisites

You'll need:
- **Node.js 20+** (LTS recommended)
- **pnpm 8+** (install with `npm install -g pnpm`)
- **Git** (for version control)
- **PostgreSQL 15+** with pgvector extension (or Supabase account)
- **API keys** for LLM providers (OpenAI, Anthropic, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Vibe-Marketer/ai-agent-mastery-ts.git
cd ai-agent-mastery-ts
```

2. **Install dependencies** (when packages are ready)
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

4. **Initialize database** (coming soon)
```bash
pnpm db:setup
```

5. **Start development** (when packages are implemented)
```bash
pnpm dev
```

## 📖 What This Project Will Replicate

This TypeScript version will implement ALL functionality from the original Python course:

### Module 3: n8n Workflows ✅
- No migration needed - n8n workflows are JSON files (language-agnostic)
- You can use the original n8n workflow files

### Module 4: Core Agent (In Progress)
Will implement using **Mastra**:
- Multi-LLM support (OpenAI, Anthropic, Groq, Ollama, etc.)
- Tools: Web search, RAG, SQL, Image analysis, Code execution
- Long-term memory (Mem0-like implementation)
- Streaming responses

### Module 5: Full-Stack Application (Planned)
Will use:
- **Backend**: Hono API server (replaces FastAPI)
- **Frontend**: React + TypeScript (can reuse existing!)
- **Database**: PostgreSQL + pgvector via Supabase
- **Auth**: Supabase authentication

### Module 6: Deployment (Planned)
Will support:
- Docker containerization
- CI/CD with GitHub Actions
- Multiple deployment targets:
  - Vercel (recommended for TypeScript)
  - DigitalOcean
  - Render
- Langfuse observability

### Module 7: Agent Architectures (Planned)
All 8 patterns using **LangGraph.js**:
1. Agent-as-Tool
2. Agent Handoff
3. LLM Routing
4. Sequential Agents
5. Parallel Agents
6. Supervisor Pattern
7. Guardrail Pattern
8. Human-in-the-Loop

## 🛠️ Development Workflow

### Available Scripts

```bash
# Run all packages in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format

# Clean build artifacts
pnpm clean

# Database operations (when implemented)
pnpm db:setup
pnpm db:migrate

# Docker operations (when implemented)
pnpm docker:build
pnpm docker:up
pnpm docker:down
```

## 📚 Tech Stack

| Python Original | TypeScript Replacement |
|----------------|----------------------|
| Pydantic AI | Mastra + Vercel AI SDK |
| LangGraph | LangGraph.js |
| FastAPI | Hono |
| Pydantic | Zod |
| Streamlit | React (from Module 5) |
| uvicorn | Built into Node.js |
| Supabase-py | @supabase/supabase-js |
| pytest | Vitest |

## 🎓 Learning Path

If you're new to TypeScript agents, here's the recommended approach:

1. **Start Simple**: Learn Mastra basics with a simple agent
2. **Add Tools**: Implement one tool at a time
3. **Add RAG**: Integrate document retrieval
4. **Add Memory**: Implement conversation history
5. **Complex Workflows**: Graduate to LangGraph patterns

## 📋 Migration Roadmap

See [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md) for the complete 18-week migration plan.

**Current Status:** Week 1, Phase 1 - Foundation (5% complete)

**Next Milestone:** Complete shared types, database setup, and Docker config (Week 1-2)

## 🤝 Contributing

This is an educational project and contributions are welcome!

To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📖 Documentation

- [Migration Progress](./MIGRATION_PROGRESS.md) - Detailed migration tracking
- [README](./README.md) - Project overview
- Architecture docs (coming soon)
- API reference (coming soon)

## 🔗 Resources

### Frameworks & Libraries
- [Mastra Documentation](https://mastra.ai/docs)
- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Hono Documentation](https://hono.dev/)
- [Zod Documentation](https://zod.dev/)

### Original Course
- [AI Agent Mastery Course](https://community.dynamous.ai/s/ai-mastery-course/)
- [Original Python Repository](https://github.com/dynamous-community/ai-agent-mastery)

## ❓ FAQ

**Q: Can I use this now?**
A: Not yet! We're only 5% complete. This is the foundation setup. Core functionality is coming in the next few weeks.

**Q: When will it be ready?**
A: Following the 18-week migration plan, full feature parity is expected in ~4 months.

**Q: Can I help?**
A: Absolutely! Check the [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md) for tasks that need work.

**Q: Should I learn from the Python version or wait for TypeScript?**
A: If you need to learn NOW, use the Python version. If you prefer TypeScript and can wait, star this repo and check back in a few weeks.

**Q: Will this work with Lovable.dev?**
A: Yes! That's one of the goals. The TypeScript implementation will be Lovable.dev compatible.

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Vibe-Marketer/ai-agent-mastery-ts/issues)
- **Original Community**: [Dynamous Community](https://community.dynamous.ai)

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

---

**Status**: 🚧 Work in Progress - Phase 1 Foundation
**Last Updated**: January 9, 2025
**Maintainer**: [@Vibe-Marketer](https://github.com/Vibe-Marketer)
