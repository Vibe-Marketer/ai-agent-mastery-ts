# Backend API

RESTful API server built with Hono for the AI Agent Mastery platform.

## Features

- **Fast & Lightweight**: Built on Hono, one of the fastest web frameworks for Node.js
- **Authentication**: Supabase-based authentication with JWT tokens
- **Streaming**: Server-Sent Events (SSE) for real-time agent responses
- **Document Management**: Upload and process documents for RAG
- **Conversation History**: Track and manage chat conversations
- **CORS**: Configurable cross-origin resource sharing
- **Type-Safe**: Full TypeScript support with Zod validation

## Installation

```bash
pnpm install
```

## Environment Variables

Required environment variables (add to `.env`):

```bash
# Server
PORT=8000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# LLM
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_api_key
LLM_TEMPERATURE=0.7

# Embeddings
EMBEDDING_API_KEY=your_embedding_key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

## Development

```bash
# Start in watch mode
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Health Check

#### GET /api/health
Basic health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

#### GET /api/health/detailed
Detailed health check with service status.

### Chat

#### POST /api/chat
Send a message to the AI agent.

**Headers:**
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "message": "Hello, how are you?",
  "conversationId": "optional-conversation-id",
  "sessionId": "optional-session-id",
  "streaming": true
}
```

**Response (streaming):**
Server-Sent Events stream with chunks:
```
data: {"type":"chunk","content":"Hello"}
data: {"type":"chunk","content":" there"}
data: [DONE]
```

**Response (non-streaming):**
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing well, thank you!",
    "conversationId": "conv-123",
    "sessionId": "session-456",
    "toolCalls": []
  }
}
```

#### GET /api/chat/history/:conversationId
Get conversation history.

**Headers:**
- `Authorization: Bearer <token>`

### Documents

#### POST /api/documents/upload
Upload a document for RAG processing.

**Headers:**
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "content": "base64-encoded-content",
  "chunkSize": 1000,
  "chunkOverlap": 200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "user123_uuid",
    "fileName": "document.pdf",
    "fileUrl": "https://storage.url/file",
    "mimeType": "application/pdf",
    "textLength": 5000
  }
}
```

#### GET /api/documents
List all documents for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [...],
    "total": 10
  }
}
```

#### GET /api/documents/:fileId
Get document details.

**Headers:**
- `Authorization: Bearer <token>`

#### DELETE /api/documents/:fileId
Delete a document.

**Headers:**
- `Authorization: Bearer <token>`

### Conversations

#### GET /api/conversations
List all conversations for the authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [...],
    "total": 5
  }
}
```

#### POST /api/conversations
Create a new conversation.

**Headers:**
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "New Chat",
  "metadata": {}
}
```

#### GET /api/conversations/:conversationId
Get conversation details and messages.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "title": "My Chat",
    "messages": [...]
  }
}
```

#### PATCH /api/conversations/:conversationId
Update conversation details.

**Headers:**
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Updated Title",
  "metadata": {}
}
```

#### DELETE /api/conversations/:conversationId
Delete a conversation.

**Headers:**
- `Authorization: Bearer <token>`

## Authentication

The API uses Supabase JWT tokens for authentication. To authenticate:

1. Sign in using Supabase Auth
2. Get the access token from the session
3. Include the token in the `Authorization` header:
   ```
   Authorization: Bearer <your-token>
   ```

Protected endpoints will return `401 Unauthorized` if the token is missing or invalid.

## Error Handling

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": {}
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not allowed)
- `404` - Not Found
- `500` - Internal Server Error

## Architecture

```
Backend API
├── middleware/
│   ├── auth.ts       # Authentication
│   ├── cors.ts       # CORS configuration
│   └── logger.ts     # Request logging
├── routes/
│   ├── chat.ts       # Chat endpoints
│   ├── documents.ts  # Document management
│   ├── conversations.ts # Conversation history
│   └── health.ts     # Health checks
├── app.ts            # Hono application setup
├── server.ts         # Server entry point
└── index.ts          # Exports
```

## Deployment

### Docker

```bash
docker build -t backend-api .
docker run -p 8000:8000 --env-file .env backend-api
```

### Node.js

```bash
pnpm build
NODE_ENV=production pnpm start
```

## License

MIT
