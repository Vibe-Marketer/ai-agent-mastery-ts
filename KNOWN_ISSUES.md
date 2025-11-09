# Known Issues - ai-agent-mastery-ts

This document tracks known issues that need to be resolved before the codebase is production-ready.

## CRITICAL Issues (Build-Blocking)

### 1. Mastra API Incompatibility ⚠️ HIGH PRIORITY
**Affected Files**:
- `packages/core-agent/src/agent/agent.ts`

**Problem**:
The current implementation assumes Mastra v0.1.0 has methods like `run()` and `stream()`, but these don't exist in the actual Mastra API.

**Current Code**:
```typescript
const result = await this.mastra.run({
  messages,
  maxSteps: options.maxSteps,
});
```

**Required Action**:
1. Review Mastra v0.1.0 documentation at https://mastra.ai/docs
2. Update `AIAgent` class to use correct Mastra methods (likely `generate()` or similar)
3. Fix constructor to not pass unsupported `name` property
4. Update streaming implementation

**Estimated Time**: 2-4 hours
**Severity**: CRITICAL - Core agent functionality completely broken

---

### 2. Memory Table Missing from Database Schema
**Affected Files**:
- `packages/core-agent/src/memory/mem0.ts`
- `database/schemas/00-complete-schema.sql`

**Problem**:
The memory system references a `memories` table that doesn't exist in the database schema.

**Required Action**:
Add the following to the database schema:

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX memories_user_id_idx ON memories(user_id);
CREATE INDEX memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops);
```

**Estimated Time**: 30 minutes
**Severity**: CRITICAL - Memory functionality will fail at runtime

---

## HIGH Priority Issues

### 3. Agent Initialization API Mismatch
**Affected Files**:
- `packages/backend-api/src/routes/chat.ts`

**Problem**:
The chat route passes incorrect properties to the AIAgent constructor.

**Current Code**:
```typescript
const agent = new AIAgent({
  llmProvider: env.LLM_PROVIDER,
  llmModel: env.LLM_MODEL,
  llmApiKey: env.LLM_API_KEY,
});
```

**Fix**:
```typescript
const agent = new AIAgent({
  model: env.LLM_MODEL,
  apiKey: env.LLM_API_KEY,
  temperature: env.LLM_TEMPERATURE,
});
```

**Estimated Time**: 15 minutes
**Severity**: HIGH - Agent initialization fails

---

### 4. Auth Middleware Applied to Health Endpoint
**Affected Files**:
- `packages/backend-api/src/app.ts`

**Problem**:
Health check endpoint requires authentication, which prevents monitoring.

**Fix**:
```typescript
app.use('*', corsMiddleware);
app.use('*', requestLogger);

// Health endpoint (no auth)
app.route('/api/health', healthRouter);

// Protected routes
app.use('/api/*', authMiddleware);
app.route('/api/chat', chatRouter);
// ...
```

**Estimated Time**: 10 minutes
**Severity**: HIGH - Health checks fail in production

---

### 5. Database Delete Operations Return Type Issues
**Affected Files**:
- `packages/rag-pipeline/src/uploader/db-handler.ts`

**Problem**:
Trying to access `.length` on Supabase delete response which doesn't return data.

**Fix**:
```typescript
const { error: chunksError } = await supabase
  .from('documents')
  .delete()
  .eq('metadata->>file_id', fileId);

if (chunksError) throw chunksError;
logger.info(`Deleted chunks for file ${fileId}`);
```

**Estimated Time**: 10 minutes
**Severity**: HIGH - Document deletion fails

---

## MEDIUM Priority Issues

### 6. Large File Storage in Database
**Affected Files**:
- `packages/rag-pipeline/src/uploader/db-handler.ts` (line 93)

**Problem**:
Storing entire files as base64 in database metadata causes bloat.

**Fix**:
Store files in Supabase Storage and keep only URLs in metadata.

**Estimated Time**: 1 hour
**Severity**: MEDIUM - Performance degradation with large files

---

### 7. No Input Validation at API Boundaries
**Affected Files**:
- All routes in `packages/backend-api/src/routes/`

**Problem**:
API doesn't validate inputs using the Zod schemas from shared package.

**Fix**:
Add validation middleware:
```typescript
import { chatRequestSchema } from '@ai-agent-mastery/shared';

const body = chatRequestSchema.parse(await c.req.json());
```

**Estimated Time**: 2 hours
**Severity**: MEDIUM - Security and data integrity risks

---

### 8. Inconsistent Error Handling
**Affected Files**:
- All tool files in `packages/core-agent/src/tools/`

**Problem**:
Some tools throw generic errors instead of using custom error classes.

**Fix**:
Standardize to use `ToolExecutionError`, `ExternalServiceError`, etc.

**Estimated Time**: 1 hour
**Severity**: MEDIUM - Debugging difficulties

---

## LOW Priority Issues

### 9. Unused Code
**Affected Files**:
- `packages/core-agent/src/agent/agent.ts` (line 31: unused supabase client)
- `packages/rag-pipeline/src/cli.ts` (lines 108, 115: unused variables)

**Fix**:
Remove unused code or use it.

**Estimated Time**: 15 minutes
**Severity**: LOW - Code quality

---

### 10. Limited LLM Provider Support in LangGraph
**Affected Files**:
- `packages/langgraph-workflows/src/utils/llm-factory.ts`

**Problem**:
Only supports OpenAI and Anthropic, not Groq, Ollama, etc. listed in env schema.

**Fix**:
Add factory cases for other providers.

**Estimated Time**: 1 hour
**Severity**: LOW - Limited flexibility

---

## Issues FIXED (for reference)

✅ **Missing environment variables** - Fixed by adding LLM_TEMPERATURE, LLM_MAX_TOKENS, PORT, ALLOWED_ORIGINS to env schema

✅ **Missing dependencies** - Fixed by adding commander and vm2 to package.json files

✅ **TypeScript incremental build conflicts** - Fixed by adding `"incremental": false` to tsconfig files

✅ **Brave Search API incorrect usage** - Fixed by using URLSearchParams correctly

✅ **Type safety issues with unknown data** - Fixed by adding proper type assertions

---

## Summary

**Total Issues**: 10 remaining
- CRITICAL: 2 (Mastra API, Memory table)
- HIGH: 3 (Agent init, Auth middleware, Delete operations)
- MEDIUM: 3 (File storage, Input validation, Error handling)
- LOW: 2 (Unused code, LLM providers)

**Estimated Time to Fix All Issues**: 12-16 hours

**Next Steps**:
1. Fix Mastra API usage (requires reviewing Mastra documentation)
2. Add memories table to database schema
3. Fix agent initialization across packages
4. Fix auth middleware ordering
5. Address medium and low priority issues

---

## Contributing

When fixing issues:
1. Create a branch for each fix
2. Update this document when an issue is resolved
3. Move fixed issues to the "Issues FIXED" section
4. Add tests for the fix
5. Update relevant documentation

