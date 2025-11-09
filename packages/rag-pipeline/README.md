# RAG Pipeline

Retrieval-Augmented Generation (RAG) pipeline for document processing, embedding generation, and semantic search.

## Features

- **Document Processing**: Extract text from PDF, DOCX, Markdown, CSV, and plain text files
- **Text Chunking**: Split documents into optimal chunks with configurable size and overlap
- **Embeddings**: Generate vector embeddings using OpenAI or compatible APIs
- **File Watching**: Monitor local directories or Google Drive folders for changes
- **Database Storage**: Store documents, chunks, embeddings, and metadata in PostgreSQL with pgvector
- **CSV Support**: Extract schema and rows from CSV files for SQL queries

## Installation

```bash
pnpm install
```

## Environment Variables

Required environment variables (add to `.env`):

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Embeddings
EMBEDDING_API_KEY=your_openai_api_key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small

# Local File Watching (optional)
RAG_WATCH_DIRECTORY=./documents
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Google Drive Watching (optional)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

## CLI Usage

### Watch Local Directory

Monitor a local directory for file changes and automatically process them:

```bash
pnpm rag-pipeline watch-local
pnpm rag-pipeline watch-local --directory ./my-docs
pnpm rag-pipeline watch-local --chunk-size 1500 --chunk-overlap 300
```

### Watch Google Drive Folder

Monitor a Google Drive folder for changes:

```bash
pnpm rag-pipeline watch-drive
pnpm rag-pipeline watch-drive --folder-id abc123
pnpm rag-pipeline watch-drive --interval 600000  # Check every 10 minutes
```

### Process Single File

Process a single file:

```bash
pnpm rag-pipeline process-file ./document.pdf
pnpm rag-pipeline process-file ./data.csv --chunk-size 2000
```

### Process Directory

Process all files in a directory (one-time, non-watching):

```bash
pnpm rag-pipeline process-directory ./documents
pnpm rag-pipeline process-directory ./documents --recursive
```

## Programmatic Usage

### Process a File

```typescript
import { processFileForRAG, extractTextFromFile } from '@ai-agent-mastery/rag-pipeline';
import * as fs from 'fs/promises';

const fileContent = await fs.readFile('./document.pdf');
const text = await extractTextFromFile(fileContent, 'application/pdf', 'document.pdf');

const success = await processFileForRAG({
  fileContent,
  text,
  fileId: 'unique-file-id',
  fileUrl: 'file://path/to/document.pdf',
  fileTitle: 'document.pdf',
  mimeType: 'application/pdf',
  chunkSize: 1000,
  chunkOverlap: 200,
});
```

### Start File Watcher

```typescript
import { createFileWatcher } from '@ai-agent-mastery/rag-pipeline';

const watcher = await createFileWatcher({
  watchDirectory: './documents',
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Later, stop the watcher
await watcher.stop();
```

### Start Google Drive Watcher

```typescript
import { createGoogleDriveWatcher } from '@ai-agent-mastery/rag-pipeline';

const watcher = await createGoogleDriveWatcher({
  folderId: 'your-folder-id',
  checkInterval: 300000, // 5 minutes
});

// Later, stop the watcher
watcher.stop();
```

### Text Processing Functions

```typescript
import {
  chunkText,
  extractTextFromPDF,
  extractTextFromDOCX,
  createEmbeddings,
  extractSchemaFromCSV,
  extractRowsFromCSV,
} from '@ai-agent-mastery/rag-pipeline';

// Chunk text
const chunks = chunkText(longText, 1000, 200);

// Extract from PDF
const pdfText = await extractTextFromPDF(pdfBuffer);

// Create embeddings
const embeddings = await createEmbeddings(chunks);

// CSV operations
const schema = extractSchemaFromCSV(csvBuffer);
const rows = extractRowsFromCSV(csvBuffer);
```

## Supported File Types

- **PDF**: `.pdf`
- **Word**: `.docx`
- **Markdown**: `.md`
- **Plain Text**: `.txt`
- **CSV**: `.csv`
- **JSON**: `.json`

## How It Works

1. **File Detection**: Files are detected through:
   - File watcher (chokidar for local, Google Drive API for cloud)
   - Manual processing via CLI
   - Programmatic API calls

2. **Text Extraction**: Files are processed based on their MIME type:
   - PDF: Uses `pdf-parse` library
   - DOCX: Uses `mammoth` library
   - Markdown: Converts to plain text
   - CSV: Extracts schema and rows
   - Plain text: Direct UTF-8 decoding

3. **Chunking**: Text is split into overlapping chunks:
   - Default chunk size: 1000 characters
   - Default overlap: 200 characters
   - Configurable via options

4. **Embedding Generation**: Chunks are converted to vectors:
   - Uses OpenAI embeddings API (or compatible)
   - Default model: `text-embedding-3-small`
   - Batch processing for efficiency

5. **Database Storage**: Documents are stored in PostgreSQL:
   - `documents`: Chunks with embeddings for semantic search
   - `document_metadata`: File metadata and schemas
   - `document_rows`: CSV rows for SQL queries
   - Uses pgvector extension for vector similarity search

## Database Schema

The pipeline uses three main tables:

### documents
Stores document chunks with embeddings for semantic search.

### document_metadata
Stores file metadata including title, URL, and schema (for CSV files).

### document_rows
Stores individual rows from CSV files for SQL query support.

## Architecture

```
RAG Pipeline
├── processors/
│   └── text-processor.ts     # Text extraction and chunking
├── uploader/
│   └── db-handler.ts          # Database operations
├── watcher/
│   ├── file-watcher.ts        # Local file monitoring
│   └── google-drive-watcher.ts # Google Drive monitoring
├── cli.ts                     # Command-line interface
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

## License

MIT
