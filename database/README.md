# Database Setup

This directory contains all database-related files for the AI Agent Mastery TypeScript edition.

## Quick Start

### Using Supabase (Recommended)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your connection details** from Project Settings → Database:
   - Copy the connection string (Transaction Pooler)
   - Copy the direct connection string (Direct Connection)

3. **Run the schema** in the Supabase SQL Editor:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `schemas/00-complete-schema.sql`
   - Click "Run" to execute

4. **Update your `.env` file**:
   ```env
   DATABASE_URL=your_transaction_pooler_connection_string
   DIRECT_DATABASE_URL=your_direct_connection_string
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

### Using Local PostgreSQL

1. **Install PostgreSQL 15+** with the pgvector extension

2. **Create a database**:
   ```bash
   createdb ai_agent_mastery
   ```

3. **Install pgvector extension**:
   ```bash
   psql -d ai_agent_mastery -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

4. **Run the schema**:
   ```bash
   psql -d ai_agent_mastery -f schemas/00-complete-schema.sql
   ```

5. **Update your `.env` file**:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_agent_mastery
   ```

## Database Schema

### Tables

1. **user_profiles** - User account information
   - Automatically created when a user signs up
   - Includes admin flag for elevated permissions

2. **requests** - User query history
   - Tracks all user requests
   - Used for analytics and debugging

3. **conversations** - Chat conversations
   - One conversation can have many messages
   - Tracks conversation metadata and title

4. **messages** - Individual messages in conversations
   - Stores message content as JSONB
   - Includes computed user ID for efficient queries

5. **document_metadata** - Document information
   - Metadata about uploaded/processed documents
   - Links to document chunks and rows

6. **document_rows** - Structured data from CSV files
   - Stores row data as JSONB
   - Used by SQL execution tool

7. **documents** - Document chunks with embeddings
   - Main table for RAG (Retrieval Augmented Generation)
   - Stores vector embeddings for semantic search
   - **IMPORTANT**: Vector dimension must match your embedding model

8. **rag_pipeline_state** - RAG pipeline synchronization
   - Tracks file processing state
   - Prevents duplicate processing

### Functions

- `handle_new_user()` - Auto-creates user profile on signup
- `is_admin()` - Checks if current user is admin
- `match_documents()` - Semantic search over document embeddings
- `execute_custom_sql()` - Execute SQL queries on document rows
- `update_rag_pipeline_state_updated_at()` - Auto-update timestamp

### Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Admins have full access
- Document tables are backend-only (no frontend access)
- Service role key required for backend operations

## Vector Embeddings

The database uses pgvector for semantic search. **IMPORTANT**: The vector dimension must match your embedding model.

### Supported Models

| Model | Provider | Dimensions | Update Required |
|-------|----------|------------|-----------------|
| text-embedding-3-small | OpenAI | 1536 | No (default) |
| text-embedding-3-large | OpenAI | 3072 | Yes |
| nomic-embed-text | Ollama | 768 | Yes |
| mxbai-embed-large | Ollama | 1024 | Yes |

### Changing Vector Dimensions

If using a different embedding model, update these sections in `schemas/00-complete-schema.sql`:

1. **Documents table** (line ~157):
   ```sql
   embedding vector(1536)  -- Change 1536 to your dimension
   ```

2. **match_documents function** (line ~218):
   ```sql
   query_embedding vector(1536),  -- Change 1536 to your dimension
   ```

Then re-run the schema to recreate the table and function.

## Migrations

Currently using direct SQL scripts. In the future, migrations will be managed with a proper migration tool (e.g., Drizzle, Prisma).

To create a migration:
1. Add a new file in `schemas/` with a numbered prefix (e.g., `01-add-feature.sql`)
2. Document the changes in this README
3. Run the migration manually or via CI/CD

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -d ai_agent_mastery > backup.sql

# Schema only
pg_dump -d ai_agent_mastery --schema-only > schema-backup.sql

# Data only
pg_dump -d ai_agent_mastery --data-only > data-backup.sql
```

### Restore

```bash
psql -d ai_agent_mastery < backup.sql
```

## Performance Optimization

### Indexes

The schema includes indexes on:
- Foreign keys for joins
- Frequently queried columns (user_id, session_id)
- RAG pipeline state tracking

### Vector Search Optimization

For better vector search performance:

1. **Create an HNSW index** (after populating data):
   ```sql
   CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
   ```

2. **Analyze the table** regularly:
   ```sql
   ANALYZE documents;
   ```

## Troubleshooting

### pgvector extension not found

```bash
# Install pgvector
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

Then in PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Permission denied on tables

Make sure Row Level Security policies are properly configured. Check:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Slow vector search

- Create HNSW index (see Performance Optimization above)
- Reduce `topK` parameter in queries
- Consider using filters to reduce search space

## Development

### Reset Database

```bash
# Drop and recreate (WARNING: loses all data)
psql -d postgres -c "DROP DATABASE IF EXISTS ai_agent_mastery;"
psql -d postgres -c "CREATE DATABASE ai_agent_mastery;"
psql -d ai_agent_mastery -f schemas/00-complete-schema.sql
```

### Seed Data

Coming soon - sample data for development and testing.

## Production Considerations

- Enable connection pooling (e.g., PgBouncer)
- Set up regular backups
- Monitor query performance
- Scale database resources based on usage
- Consider read replicas for analytics
- Enable SSL/TLS for connections
- Rotate database credentials regularly

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
