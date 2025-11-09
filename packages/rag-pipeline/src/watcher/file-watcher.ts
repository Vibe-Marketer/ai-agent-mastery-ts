/**
 * Local File Watcher
 * Watches a directory for new/modified files and processes them for RAG
 */

import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { extractTextFromFile } from '../processors/text-processor.js';
import { processFileForRAG } from '../uploader/db-handler.js';

interface FileWatcherConfig {
  watchDirectory: string;
  chunkSize?: number;
  chunkOverlap?: number;
  supportedExtensions?: string[];
}

export class LocalFileWatcher {
  private watchDirectory: string;
  private watcher: chokidar.FSWatcher | null = null;
  private processedFiles: Map<string, number> = new Map(); // filepath -> lastModified
  private config: FileWatcherConfig;

  constructor(config?: Partial<FileWatcherConfig>) {
    const env = getEnv();

    this.config = {
      watchDirectory: config?.watchDirectory || env.RAG_WATCH_DIRECTORY || './documents',
      chunkSize: config?.chunkSize || env.CHUNK_SIZE,
      chunkOverlap: config?.chunkOverlap || env.CHUNK_OVERLAP,
      supportedExtensions: config?.supportedExtensions || [
        '.pdf',
        '.txt',
        '.md',
        '.csv',
        '.docx',
        '.json',
      ],
    };

    this.watchDirectory = path.resolve(this.config.watchDirectory);

    logger.info('File watcher initialized', {
      watchDirectory: this.watchDirectory,
      chunkSize: this.config.chunkSize,
      supportedExtensions: this.config.supportedExtensions,
    });
  }

  /**
   * Start watching the directory
   */
  async start(): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.watchDirectory, { recursive: true });

    logger.info('Starting file watcher', { directory: this.watchDirectory });

    // Initial scan of existing files
    await this.scanExistingFiles();

    // Set up file watcher
    this.watcher = chokidar.watch(this.watchDirectory, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // We already scanned
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filepath) => this.handleFileAdded(filepath))
      .on('change', (filepath) => this.handleFileChanged(filepath))
      .on('unlink', (filepath) => this.handleFileDeleted(filepath))
      .on('error', (error) => logger.error('Watcher error', { error }));

    logger.info('File watcher started successfully');
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      logger.info('File watcher stopped');
    }
  }

  /**
   * Scan existing files on startup
   */
  private async scanExistingFiles(): Promise<void> {
    logger.info('Scanning existing files');

    try {
      const files = await this.getFilesRecursively(this.watchDirectory);

      for (const filepath of files) {
        if (this.isSupported(filepath)) {
          await this.processFile(filepath);
        }
      }

      logger.info('Initial scan complete', { filesProcessed: this.processedFiles.size });
    } catch (error) {
      logger.error('Error scanning existing files', { error });
    }
  }

  /**
   * Get all files recursively
   */
  private async getFilesRecursively(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? this.getFilesRecursively(fullPath) : [fullPath];
      })
    );
    return files.flat();
  }

  /**
   * Check if file is supported
   */
  private isSupported(filepath: string): boolean {
    const ext = path.extname(filepath).toLowerCase();
    return this.config.supportedExtensions!.includes(ext);
  }

  /**
   * Get MIME type from filepath
   */
  private getMimeType(filepath: string): string {
    const ext = path.extname(filepath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Process a file
   */
  private async processFile(filepath: string): Promise<void> {
    logger.info('Processing file', { filepath });

    try {
      // Read file
      const fileContent = await fs.readFile(filepath);
      const stats = await fs.stat(filepath);

      // Extract text
      const mimeType = this.getMimeType(filepath);
      const filename = path.basename(filepath);
      const text = await extractTextFromFile(fileContent, mimeType, filename);

      // Use filepath as ID (relative to watch directory)
      const relativePath = path.relative(this.watchDirectory, filepath);
      const fileId = relativePath.replace(/[\/\\]/g, '_');

      // Process for RAG
      const success = await processFileForRAG({
        fileContent,
        text,
        fileId,
        fileUrl: `file://${filepath}`,
        fileTitle: filename,
        mimeType,
        chunkSize: this.config.chunkSize,
        chunkOverlap: this.config.chunkOverlap,
      });

      if (success) {
        this.processedFiles.set(filepath, stats.mtimeMs);
        logger.info('File processed successfully', { filepath, fileId });
      }
    } catch (error) {
      logger.error('File processing failed', { error, filepath });
    }
  }

  /**
   * Handle file added
   */
  private async handleFileAdded(filepath: string): Promise<void> {
    if (this.isSupported(filepath)) {
      logger.info('New file detected', { filepath });
      await this.processFile(filepath);
    }
  }

  /**
   * Handle file changed
   */
  private async handleFileChanged(filepath: string): Promise<void> {
    if (this.isSupported(filepath)) {
      logger.info('File changed', { filepath });
      await this.processFile(filepath);
    }
  }

  /**
   * Handle file deleted
   */
  private async handleFileDeleted(filepath: string): Promise<void> {
    if (this.processedFiles.has(filepath)) {
      logger.info('File deleted', { filepath });

      const relativePath = path.relative(this.watchDirectory, filepath);
      const fileId = relativePath.replace(/[\/\\]/g, '_');

      // Delete from database
      const { deleteDocumentByFileId } = await import('../uploader/db-handler.js');
      await deleteDocumentByFileId(fileId);

      this.processedFiles.delete(filepath);
    }
  }
}

/**
 * Create and start file watcher
 */
export async function createFileWatcher(config?: Partial<FileWatcherConfig>): Promise<LocalFileWatcher> {
  const watcher = new LocalFileWatcher(config);
  await watcher.start();
  return watcher;
}
