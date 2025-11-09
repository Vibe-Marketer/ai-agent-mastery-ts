/**
 * Database Handler
 * Export all database operations
 */

export {
  deleteDocumentByFileId,
  insertDocumentChunks,
  insertOrUpdateDocumentMetadata,
  insertDocumentRows,
  processFileForRAG,
} from './db-handler.js';
