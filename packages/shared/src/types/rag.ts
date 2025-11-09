/**
 * RAG (Retrieval Augmented Generation) Types
 */

export interface Document {
  id: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  userId: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: DocumentStatus;
  metadata?: DocumentMetadata;
  source: DocumentSource;
  chunksCount?: number;
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type DocumentSource = 'local_file' | 'google_drive' | 'upload' | 'url';

export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  language?: string;
  pageCount?: number;
  wordCount?: number;
  [key: string]: unknown;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  metadata?: ChunkMetadata;
  embedding?: number[];
  embeddingModel?: string;
  createdAt: Date;
}

export interface ChunkMetadata {
  pageNumber?: number;
  section?: string;
  heading?: string;
  [key: string]: unknown;
}

export interface DocumentRow {
  id: string;
  documentId: string;
  rowIndex: number;
  rowData: Record<string, unknown>;
  createdAt: Date;
}

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  provider: 'openai' | 'ollama';
}

export interface ChunkingStrategy {
  strategy: 'fixed_size' | 'semantic' | 'recursive';
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export interface VectorSearchQuery {
  embedding: number[];
  topK?: number;
  similarityThreshold?: number;
  filter?: VectorSearchFilter;
}

export interface VectorSearchFilter {
  documentIds?: string[];
  userId?: string;
  source?: DocumentSource;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  metadata?: ChunkMetadata;
  document?: {
    filename: string;
    source: DocumentSource;
  };
}

export interface RAGContext {
  query: string;
  results: VectorSearchResult[];
  topK: number;
  threshold: number;
  retrievedAt: Date;
}

export interface DocumentProcessor {
  type: 'pdf' | 'csv' | 'markdown' | 'text' | 'docx';
  extract: (filepath: string) => Promise<string>;
  chunk: (content: string, strategy: ChunkingStrategy) => Promise<string[]>;
}

export interface FileWatchEvent {
  type: 'added' | 'modified' | 'deleted';
  filepath: string;
  filename: string;
  timestamp: Date;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: Date;
  webViewLink?: string;
  downloadUrl?: string;
}

export interface GoogleDriveConfig {
  folderId: string;
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  refreshToken?: string;
}
