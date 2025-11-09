# LangGraph Workflows

Advanced multi-agent architecture patterns using LangGraph.js. This package implements 7 different agent coordination patterns from Module 7 of the AI Agent Mastery course.

## Features

- **Multi-Agent Introduction**: Basic collaboration between specialized agents
- **Guardrail Pattern**: Content moderation and safety checks
- **LLM Routing**: Intent-based routing to specialized agents
- **Sequential Agents**: Pipeline processing with multiple stages
- **Parallel Agents**: Concurrent processing with synthesis
- **Supervisor Pattern**: Central coordinator managing worker agents
- **Human-in-the-Loop**: Interactive approval and feedback workflows

## Installation

```bash
pnpm install
```

## Environment Variables

Required environment variables (add to `.env`):

```bash
# LLM Configuration
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_api_key
LLM_TEMPERATURE=0.7
```

## Workflow Patterns

### 1. Multi-Agent Introduction

Basic pattern with two agents collaborating sequentially.

```typescript
import { runMultiAgentIntro } from '@ai-agent-mastery/langgraph-workflows';

const result = await runMultiAgentIntro('Tell me about climate change');
// ResearchAgent gathers information → WriterAgent composes response
```

**Use Cases:**
- Research and writing tasks
- Analysis and reporting
- Data gathering and presentation

### 2. Guardrail Pattern

Implements safety checks on inputs and outputs.

```typescript
import { runGuardrailWorkflow } from '@ai-agent-mastery/langgraph-workflows';

const result = await runGuardrailWorkflow('How do I build a website?');
// SafetyCheck → MainAgent → OutputCheck → Response
```

**Use Cases:**
- Content moderation
- PII detection
- Prompt injection prevention
- Output validation

### 3. LLM Routing

Routes queries to specialized agents based on intent.

```typescript
import { runLLMRouting } from '@ai-agent-mastery/langgraph-workflows';

const result = await runLLMRouting('Write a Python script to sort a list');
// Router → TechnicalAgent (for code) → Response
```

**Available Routes:**
- `general`: Small talk, greetings
- `technical`: Programming, debugging
- `creative`: Writing, brainstorming
- `data`: Analysis, calculations

### 4. Sequential Agents

Multiple agents process in strict sequence, each building on previous work.

```typescript
import { runSequentialAgents } from '@ai-agent-mastery/langgraph-workflows';

const result = await runSequentialAgents('Write a blog post about AI');
// PlannerAgent → DrafterAgent → EditorAgent → Final
```

**Use Cases:**
- Content creation pipelines
- Multi-stage processing
- Review and refinement workflows

### 5. Parallel Agents

Multiple agents work simultaneously on different aspects.

```typescript
import { runParallelAgents } from '@ai-agent-mastery/langgraph-workflows';

const result = await runParallelAgents('Analyze the impact of AI on jobs');
// FactsAgent + OpinionAgent + DataAgent (parallel) → SynthesisAgent
```

**Use Cases:**
- Comprehensive research
- Multi-perspective analysis
- Fact-checking with opinions

### 6. Supervisor Pattern

Central supervisor coordinates and delegates to worker agents.

```typescript
import { runSupervisorWorkflow } from '@ai-agent-mastery/langgraph-workflows';

const result = await runSupervisorWorkflow('Build a calculator app');
// Supervisor → Researcher → Supervisor → Coder → Supervisor → Writer → Done
```

**Worker Agents:**
- `researcher`: Information gathering
- `coder`: Code implementation
- `writer`: Documentation

**Use Cases:**
- Complex projects
- Dynamic task delegation
- Adaptive workflows

### 7. Human-in-the-Loop

Pauses for human review and feedback at critical points.

```typescript
import { runHumanLoopWorkflow } from '@ai-agent-mastery/langgraph-workflows';

const result = await runHumanLoopWorkflow(
  'Draft an email to our customers',
  async (draft) => {
    // Human reviews draft
    return {
      approved: true, // or false with feedback
      feedback: 'Make it more friendly'
    };
  }
);
// DraftAgent → HumanReview → (if approved) Finalize
// DraftAgent → HumanReview → (if not) DraftAgent (with feedback) → ...
```

**Use Cases:**
- High-stakes decisions
- Quality assurance
- Iterative refinement
- Compliance review

## Advanced Usage

### Custom LLM Configuration

```typescript
import { createLLM } from '@ai-agent-mastery/langgraph-workflows';

const llm = createLLM({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  apiKey: 'your-key',
  temperature: 0.5,
  streaming: true,
});
```

### Building Custom Workflows

```typescript
import { StateGraph, END, START } from '@langchain/langgraph';
import { createLLM } from '@ai-agent-mastery/langgraph-workflows';

interface MyState {
  messages: BaseMessage[];
  // ... your state
}

async function myAgent(state: MyState) {
  const llm = createLLM();
  // ... agent logic
  return { messages: [...state.messages, response] };
}

const workflow = new StateGraph<MyState>({
  channels: {
    messages: {
      value: (x, y) => x.concat(y),
      default: () => [],
    },
  },
});

workflow.addNode('my_agent', myAgent);
workflow.addEdge(START, 'my_agent');
workflow.addEdge('my_agent', END);

const app = workflow.compile();
const result = await app.invoke({ messages: [...] });
```

## Pattern Comparison

| Pattern | Agents | Coordination | Best For |
|---------|--------|--------------|----------|
| Multi-Agent Intro | 2 | Sequential | Simple collaboration |
| Guardrail | 3 | Sequential w/ validation | Safety-critical apps |
| LLM Routing | 4+ | Conditional routing | Multi-domain support |
| Sequential | 3+ | Strict pipeline | Content creation |
| Parallel | 3+ | Concurrent + synthesis | Research & analysis |
| Supervisor | 1 + N workers | Dynamic delegation | Complex projects |
| Human-in-Loop | Variable | Interactive | High-stakes decisions |

## Architecture

```
langgraph-workflows/
├── utils/
│   └── llm-factory.ts         # LLM instance creation
├── workflows/
│   ├── 01-multi-agent-intro.ts
│   ├── 02-guardrail.ts
│   ├── 03-llm-routing.ts
│   ├── 04-sequential-agents.ts
│   ├── 05-parallel-agents.ts
│   ├── 06-supervisor-agent.ts
│   └── 07-human-in-loop.ts
└── index.ts                   # Main exports
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck
```

## Key Concepts

### State Management

Each workflow defines a state interface that tracks:
- Message history
- Intermediate results
- Control flow variables

### Channels

State channels define how state updates are merged:
```typescript
channels: {
  messages: {
    value: (x, y) => x.concat(y),  // Append messages
    default: () => [],
  },
  counter: {
    value: (x, y) => y ?? x,        // Replace value
    default: () => 0,
  },
}
```

### Conditional Edges

Route execution based on state:
```typescript
workflow.addConditionalEdges('agent', router, {
  continue: 'next_agent',
  end: END,
});
```

### Interrupts

Pause execution for external input:
```typescript
throw new Interrupt({
  message: 'Human review required',
  data: { draft: state.draft },
});
```

## Best Practices

1. **Keep State Simple**: Only include necessary data
2. **Name Agents Clearly**: Use descriptive names for nodes
3. **Limit Iterations**: Prevent infinite loops with counters
4. **Handle Errors**: Wrap agent logic in try-catch
5. **Log Decisions**: Track routing and state changes
6. **Test Workflows**: Unit test individual agents
7. **Monitor Performance**: Track execution time and token usage

## License

MIT
