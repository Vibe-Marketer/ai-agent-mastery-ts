/**
 * Database Handler for RAG Pipeline
 * Handles document storage, chunking, and embedding
 */

import { createClient } from '@supabase/supabase-js';
import { getEnv, logger, DatabaseError } from '@ai-agent-mastery/shared';
import { chunkText, createEmbeddings, isTabularFile, extractSchemaFromCSV, extractRowsFromCSV } from '../processors/text-processor.js';

interface ProcessFileOptions {
  fileContent: Buffer;
  text: string;
  fileId: string;
  fileUrl: string;
  fileTitle: string;
  mimeType?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Delete all records for a file
 */
export async function deleteDocumentByFileId(fileId: string): Promise<void> {
  const env = getEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    // Delete document chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('documents')
      .delete()
      .eq('metadata->>file_id', fileId);

    if (chunksError) throw chunksError;
    logger.info(`Deleted ${chunks?.length || 0} chunks for file ${fileId}`);

    // Delete document rows
    const { data: rows, error: rowsError } = await supabase
      .from('document_rows')
      .delete()
      .eq('dataset_id', fileId);

    if (rowsError && rowsError.code !== 'PGRST116') { // Ignore not found
      logger.warn('Error deleting document rows', { error: rowsError });
    }

    // Delete metadata
    const { error: metaError } = await supabase
      .from('document_metadata')
      .delete()
      .eq('id', fileId);

    if (metaError && metaError.code !== 'PGRST116') {
      logger.warn('Error deleting document metadata', { error: metaError });
    }

    logger.info(`Deleted all records for file ${fileId}`);
  } catch (error) {
    logger.error('Failed to delete document', { error, fileId });
    throw new DatabaseError(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Insert document chunks with embeddings
 */
export async function insertDocumentChunks(
  chunks: string[],
  embeddings: number[][],
  fileId: string,
  fileUrl: string,
  fileTitle: string,
  mimeType: string,
  fileContents?: Buffer
): Promise<void> {
  const env = getEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  if (chunks.length !== embeddings.length) {
    throw new Error('Number of chunks and embeddings must match');
  }

  try {
    const data = chunks.map((chunk, i) => ({
      content: chunk,
      metadata: {
        file_id: fileId,
        file_url: fileUrl,
        file_title: fileTitle,
        mime_type: mimeType,
        chunk_index: i,
        ...(fileContents && { file_contents: fileContents.toString('base64') }),
      },
      embedding: embeddings[i],
    }));

    // Insert in batches to avoid payload size limits
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error } = await supabase.from('documents').insert(batch);

      if (error) {
        throw new DatabaseError(`Failed to insert batch: ${error.message}`);
      }
    }

    logger.info(`Inserted ${chunks.length} chunks for file ${fileId}`);
  } catch (error) {
    logger.error('Failed to insert document chunks', { error, fileId });
    throw error;
  }
}

/**
 * Insert or update document metadata
 */
export async function insertOrUpdateDocumentMetadata(
  fileId: string,
  fileTitle: string,
  fileUrl: string,
  schema?: string[]
): Promise<void> {
  const env = getEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    const { data: existing } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('id', fileId)
      .single();

    const metadata = {
      id: fileId,
      title: fileTitle,
      url: fileUrl,
      ...(schema && { schema: JSON.stringify(schema) }),
    };

    if (existing) {
      const { error } = await supabase
        .from('document_metadata')
        .update(metadata)
        .eq('id', fileId);

      if (error) throw error;
      logger.info(`Updated metadata for ${fileTitle}`);
    } else {
      const { error } = await supabase
        .from('document_metadata')
        .insert(metadata);

      if (error) throw error;
      logger.info(`Inserted metadata for ${fileTitle}`);
    }
  } catch (error) {
    logger.error('Failed to insert/update metadata', { error, fileId });
    throw new DatabaseError(`Failed to save metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Insert document rows (for CSV files)
 */
export async function insertDocumentRows(
  fileId: string,
  rows: Record<string, any>[]
): Promise<void> {
  const env = getEnv();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    // Delete existing rows
    await supabase.from('document_rows').delete().eq('dataset_id', fileId);

    // Insert new rows in batches
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(row => ({
        dataset_id: fileId,
        row_data: row,
      }));

      const { error } = await supabase.from('document_rows').insert(batch);
      if (error) throw error;
    }

    logger.info(`Inserted ${rows.length} rows for file ${fileId}`);
  } catch (error) {
    logger.error('Failed to insert document rows', { error, fileId });
    throw new DatabaseError(`Failed to save rows: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process file for RAG pipeline
 */
export async function processFileForRAG(options: ProcessFileOptions): Promise<boolean> {
  const {
    fileContent,
    text,
    fileId,
    fileUrl,
    fileTitle,
    mimeType = 'text/plain',
    chunkSize = 1000,
    chunkOverlap = 200,
  } = options;

  logger.info('Processing file for RAG', { fileId, fileTitle, mimeType });

  try {
    // Delete existing records
    await deleteDocumentByFileId(fileId);

    // Check if tabular
    const isTabular = isTabularFile(mimeType);
    let schema: string[] | undefined;

    if (isTabular) {
      schema = extractSchemaFromCSV(fileContent);
    }

    // Insert metadata first (foreign key requirement)
    await insertOrUpdateDocumentMetadata(fileId, fileTitle, fileUrl, schema);

    // Insert rows for tabular files
    if (isTabular) {
      const rows = extractRowsFromCSV(fileContent);
      if (rows.length > 0) {
        await insertDocumentRows(fileId, rows);
      }
    }

    // Chunk the text
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    if (chunks.length === 0) {
      logger.warn('No chunks created for file', { fileId, fileTitle });
      return true;
    }

    // Create embeddings
    const embeddings = await createEmbeddings(chunks);

    // For images, include file contents in metadata
    const fileContents = mimeType.startsWith('image/') ? fileContent : undefined;

    // Insert chunks
    await insertDocumentChunks(
      chunks,
      embeddings,
      fileId,
      fileUrl,
      fileTitle,
      mimeType,
      fileContents
    );

    logger.info('File processing completed', { fileId, fileTitle, chunks: chunks.length });
    return true;
  } catch (error) {
    logger.error('File processing failed', { error, fileId, fileTitle });
    return false;
  }
}
