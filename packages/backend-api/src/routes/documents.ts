/**
 * Document Routes
 * Handles document upload and management for RAG
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { processFileForRAG, extractTextFromFile } from '@ai-agent-mastery/rag-pipeline';
import { requireAuth, AuthContext } from '../middleware/auth.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const documentsRouter = new Hono();

// Request validation schemas
const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  content: z.string().min(1), // base64 encoded
  chunkSize: z.number().optional().default(1000),
  chunkOverlap: z.number().optional().default(200),
});

/**
 * POST /api/documents/upload
 * Upload a document for RAG processing
 */
documentsRouter.post('/upload', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;

    // Validate request body
    const body = await c.req.json();
    const { fileName, mimeType, content, chunkSize, chunkOverlap } = uploadRequestSchema.parse(body);

    logger.info('Document upload request', { userId, fileName, mimeType });

    // Decode base64 content
    const fileContent = Buffer.from(content, 'base64');

    // Extract text
    const text = await extractTextFromFile(fileContent, mimeType, fileName);

    // Generate file ID
    const fileId = `${userId}_${uuidv4()}`;

    // Upload to storage (Supabase)
    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${userId}/${fileId}`, fileContent, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload failed', { error: uploadError });
      throw new Error('Failed to upload file to storage');
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`${userId}/${fileId}`);

    const fileUrl = urlData.publicUrl;

    // Process for RAG
    const success = await processFileForRAG({
      fileContent,
      text,
      fileId,
      fileUrl,
      fileTitle: fileName,
      mimeType,
      chunkSize,
      chunkOverlap,
    });

    if (!success) {
      throw new Error('Failed to process file for RAG');
    }

    return c.json({
      success: true,
      data: {
        fileId,
        fileName,
        fileUrl,
        mimeType,
        textLength: text.length,
      },
    });
  } catch (error) {
    logger.error('Document upload error', { error });

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/documents
 * List all documents for the user
 */
documentsRouter.get('/', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get documents from metadata table
    const { data, error } = await supabase
      .from('document_metadata')
      .select('*')
      .ilike('id', `${userId}_%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: {
        documents: data || [],
        total: data?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Document list error', { error });

    return c.json(
      {
        error: 'Failed to list documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/documents/:fileId
 * Get document details
 */
documentsRouter.get('/:fileId', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;
    const fileId = c.req.param('fileId');

    // Verify ownership
    if (!fileId.startsWith(`${userId}_`)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get metadata
    const { data: metadata, error: metaError } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('id', fileId)
      .single();

    if (metaError || !metadata) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Get chunk count
    const { count: chunkCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>file_id', fileId);

    return c.json({
      success: true,
      data: {
        ...metadata,
        chunkCount: chunkCount || 0,
      },
    });
  } catch (error) {
    logger.error('Document get error', { error });

    return c.json(
      {
        error: 'Failed to get document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * DELETE /api/documents/:fileId
 * Delete a document
 */
documentsRouter.delete('/:fileId', requireAuth, async (c) => {
  try {
    const auth = c.get('auth') as AuthContext;
    const userId = auth.userId!;
    const fileId = c.req.param('fileId');

    // Verify ownership
    if (!fileId.startsWith(`${userId}_`)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`${userId}/${fileId}`]);

    if (storageError) {
      logger.warn('Storage deletion failed', { error: storageError });
    }

    // Delete from database (handled by db-handler)
    const { deleteDocumentByFileId } = await import('@ai-agent-mastery/rag-pipeline');
    await deleteDocumentByFileId(fileId);

    return c.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    logger.error('Document delete error', { error });

    return c.json(
      {
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export { documentsRouter };
