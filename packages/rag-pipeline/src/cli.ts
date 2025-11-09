#!/usr/bin/env node
/**
 * RAG Pipeline CLI
 * Command-line interface for running file watchers and processing documents
 */

import { Command } from 'commander';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { createFileWatcher, createGoogleDriveWatcher } from './watcher/index.js';
import { processFileForRAG } from './uploader/index.js';
import { extractTextFromFile } from './processors/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('rag-pipeline')
  .description('RAG Pipeline - Document processing and embedding')
  .version('1.0.0');

/**
 * Watch local directory
 */
program
  .command('watch-local')
  .description('Watch a local directory for file changes')
  .option('-d, --directory <path>', 'Directory to watch')
  .option('-c, --chunk-size <size>', 'Chunk size for text splitting', '1000')
  .option('-o, --chunk-overlap <overlap>', 'Chunk overlap', '200')
  .action(async (options) => {
    try {
      const env = getEnv();

      logger.info('Starting local file watcher', {
        directory: options.directory || env.RAG_WATCH_DIRECTORY,
        chunkSize: parseInt(options.chunkSize),
        chunkOverlap: parseInt(options.chunkOverlap),
      });

      const watcher = await createFileWatcher({
        watchDirectory: options.directory,
        chunkSize: parseInt(options.chunkSize),
        chunkOverlap: parseInt(options.chunkOverlap),
      });

      // Keep process running
      process.on('SIGINT', async () => {
        logger.info('Stopping file watcher...');
        await watcher.stop();
        process.exit(0);
      });

      logger.info('File watcher is running. Press Ctrl+C to stop.');
    } catch (error) {
      logger.error('Failed to start file watcher', { error });
      process.exit(1);
    }
  });

/**
 * Watch Google Drive folder
 */
program
  .command('watch-drive')
  .description('Watch a Google Drive folder for changes')
  .option('-f, --folder-id <id>', 'Google Drive folder ID')
  .option('-i, --interval <ms>', 'Check interval in milliseconds', '300000')
  .action(async (options) => {
    try {
      const env = getEnv();

      logger.info('Starting Google Drive watcher', {
        folderId: options.folderId || env.GOOGLE_DRIVE_FOLDER_ID,
        checkInterval: parseInt(options.interval),
      });

      const watcher = await createGoogleDriveWatcher({
        folderId: options.folderId,
        checkInterval: parseInt(options.interval),
      });

      // Keep process running
      process.on('SIGINT', () => {
        logger.info('Stopping Google Drive watcher...');
        watcher.stop();
        process.exit(0);
      });

      logger.info('Google Drive watcher is running. Press Ctrl+C to stop.');
    } catch (error) {
      logger.error('Failed to start Google Drive watcher', { error });
      process.exit(1);
    }
  });

/**
 * Process a single file
 */
program
  .command('process-file')
  .description('Process a single file for RAG')
  .argument('<filepath>', 'Path to file to process')
  .option('-c, --chunk-size <size>', 'Chunk size for text splitting', '1000')
  .option('-o, --chunk-overlap <overlap>', 'Chunk overlap', '200')
  .action(async (filepath: string, options) => {
    try {
      const env = getEnv();
      const absolutePath = path.resolve(filepath);

      logger.info('Processing file', { filepath: absolutePath });

      // Read file
      const fileContent = await fs.readFile(absolutePath);
      const stats = await fs.stat(absolutePath);
      const filename = path.basename(absolutePath);

      // Determine MIME type
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.json': 'application/json',
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      // Extract text
      const text = await extractTextFromFile(fileContent, mimeType, filename);

      // Generate file ID
      const fileId = filename.replace(/[^a-zA-Z0-9]/g, '_');

      // Process for RAG
      const success = await processFileForRAG({
        fileContent,
        text,
        fileId,
        fileUrl: `file://${absolutePath}`,
        fileTitle: filename,
        mimeType,
        chunkSize: parseInt(options.chunkSize),
        chunkOverlap: parseInt(options.chunkOverlap),
      });

      if (success) {
        logger.info('File processed successfully', { filepath: absolutePath, fileId });
      } else {
        logger.error('File processing failed', { filepath: absolutePath });
        process.exit(1);
      }
    } catch (error) {
      logger.error('Failed to process file', { error, filepath });
      process.exit(1);
    }
  });

/**
 * Process directory
 */
program
  .command('process-directory')
  .description('Process all files in a directory (non-watching)')
  .argument('<directory>', 'Directory to process')
  .option('-c, --chunk-size <size>', 'Chunk size for text splitting', '1000')
  .option('-o, --chunk-overlap <overlap>', 'Chunk overlap', '200')
  .option('-r, --recursive', 'Process subdirectories recursively', false)
  .action(async (directory: string, options) => {
    try {
      const absoluteDir = path.resolve(directory);

      logger.info('Processing directory', {
        directory: absoluteDir,
        recursive: options.recursive,
      });

      const files = await getFilesRecursively(absoluteDir, options.recursive);

      logger.info(`Found ${files.length} files to process`);

      let successCount = 0;
      let failCount = 0;

      for (const filepath of files) {
        try {
          const fileContent = await fs.readFile(filepath);
          const filename = path.basename(filepath);
          const ext = path.extname(filepath).toLowerCase();

          // Skip unsupported files
          const supportedExtensions = ['.pdf', '.txt', '.md', '.csv', '.docx', '.json'];
          if (!supportedExtensions.includes(ext)) {
            continue;
          }

          const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.csv': 'text/csv',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.json': 'application/json',
          };
          const mimeType = mimeTypes[ext] || 'application/octet-stream';

          const text = await extractTextFromFile(fileContent, mimeType, filename);
          const relativePath = path.relative(absoluteDir, filepath);
          const fileId = relativePath.replace(/[\/\\]/g, '_');

          const success = await processFileForRAG({
            fileContent,
            text,
            fileId,
            fileUrl: `file://${filepath}`,
            fileTitle: filename,
            mimeType,
            chunkSize: parseInt(options.chunkSize),
            chunkOverlap: parseInt(options.chunkOverlap),
          });

          if (success) {
            successCount++;
            logger.info(`Processed: ${relativePath}`);
          } else {
            failCount++;
            logger.error(`Failed: ${relativePath}`);
          }
        } catch (error) {
          failCount++;
          logger.error('Error processing file', { error, filepath });
        }
      }

      logger.info('Directory processing complete', {
        total: files.length,
        success: successCount,
        failed: failCount,
      });
    } catch (error) {
      logger.error('Failed to process directory', { error, directory });
      process.exit(1);
    }
  });

/**
 * Get all files recursively
 */
async function getFilesRecursively(dir: string, recursive: boolean): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        return getFilesRecursively(fullPath, recursive);
      } else if (entry.isFile()) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

program.parse();
