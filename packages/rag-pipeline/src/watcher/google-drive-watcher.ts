/**
 * Google Drive Watcher
 * Monitors Google Drive folder for new/modified files
 */

import { google, drive_v3 } from 'googleapis';
import { getEnv, logger } from '@ai-agent-mastery/shared';
import { extractTextFromFile } from '../processors/text-processor.js';
import { processFileForRAG } from '../uploader/db-handler.js';

interface GoogleDriveWatcherConfig {
  folderId: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  refreshToken?: string;
  checkInterval?: number; // milliseconds
}

export class GoogleDriveWatcher {
  private drive: drive_v3.Drive;
  private config: GoogleDriveWatcherConfig;
  private knownFiles: Map<string, string> = new Map(); // fileId -> modifiedTime
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<GoogleDriveWatcherConfig>) {
    const env = getEnv();

    this.config = {
      folderId: config?.folderId || env.GOOGLE_DRIVE_FOLDER_ID || '',
      clientId: config?.clientId || env.GOOGLE_CLIENT_ID || '',
      clientSecret: config?.clientSecret || env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || env.GOOGLE_REDIRECT_URI || '',
      refreshToken: config?.refreshToken,
      checkInterval: config?.checkInterval || 300000, // 5 minutes
    };

    // Initialize Google Drive client
    const oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );

    if (this.config.refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: this.config.refreshToken,
      });
    }

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });

    logger.info('Google Drive watcher initialized', {
      folderId: this.config.folderId,
    });
  }

  /**
   * Start watching Google Drive folder
   */
  async start(): Promise<void> {
    logger.info('Starting Google Drive watcher');

    // Initial scan
    await this.scanFolder();

    // Set up interval check
    this.checkInterval = setInterval(async () => {
      await this.scanFolder();
    }, this.config.checkInterval);

    logger.info('Google Drive watcher started', {
      checkInterval: this.config.checkInterval,
    });
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Google Drive watcher stopped');
    }
  }

  /**
   * Scan folder for changes
   */
  private async scanFolder(): Promise<void> {
    logger.info('Scanning Google Drive folder', { folderId: this.config.folderId });

    try {
      const { data } = await this.drive.files.list({
        q: `'${this.config.folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
        pageSize: 1000,
      });

      const files = data.files || [];
      const currentFileIds = new Set<string>();

      for (const file of files) {
        if (!file.id || !file.name || !file.mimeType) continue;

        currentFileIds.add(file.id);

        const lastModified = file.modifiedTime || '';
        const knownModified = this.knownFiles.get(file.id);

        // New or modified file
        if (!knownModified || knownModified !== lastModified) {
          await this.processFile(file);
          this.knownFiles.set(file.id, lastModified);
        }
      }

      // Check for deleted files
      for (const [fileId, _] of this.knownFiles) {
        if (!currentFileIds.has(fileId)) {
          await this.handleFileDeleted(fileId);
          this.knownFiles.delete(fileId);
        }
      }

      logger.info('Folder scan complete', {
        filesFound: files.length,
        filesTracked: this.knownFiles.size,
      });
    } catch (error) {
      logger.error('Error scanning Google Drive folder', { error });
    }
  }

  /**
   * Process a Google Drive file
   */
  private async processFile(file: drive_v3.Schema$File): Promise<void> {
    logger.info('Processing Google Drive file', {
      fileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
    });

    try {
      // Download file
      const { data } = await this.drive.files.get(
        { fileId: file.id!, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      const fileContent = Buffer.from(data as ArrayBuffer);

      // Extract text
      const text = await extractTextFromFile(
        fileContent,
        file.mimeType!,
        file.name!
      );

      // Process for RAG
      const env = getEnv();
      const success = await processFileForRAG({
        fileContent,
        text,
        fileId: file.id!,
        fileUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
        fileTitle: file.name!,
        mimeType: file.mimeType!,
        chunkSize: env.CHUNK_SIZE,
        chunkOverlap: env.CHUNK_OVERLAP,
      });

      if (success) {
        logger.info('Google Drive file processed successfully', {
          fileId: file.id,
          name: file.name,
        });
      }
    } catch (error) {
      logger.error('Google Drive file processing failed', {
        error,
        fileId: file.id,
        name: file.name,
      });
    }
  }

  /**
   * Handle file deletion
   */
  private async handleFileDeleted(fileId: string): Promise<void> {
    logger.info('Google Drive file deleted', { fileId });

    try {
      const { deleteDocumentByFileId } = await import('../uploader/db-handler.js');
      await deleteDocumentByFileId(fileId);
    } catch (error) {
      logger.error('Error handling deleted file', { error, fileId });
    }
  }
}

/**
 * Create and start Google Drive watcher
 */
export async function createGoogleDriveWatcher(
  config?: Partial<GoogleDriveWatcherConfig>
): Promise<GoogleDriveWatcher> {
  const watcher = new GoogleDriveWatcher(config);
  await watcher.start();
  return watcher;
}
