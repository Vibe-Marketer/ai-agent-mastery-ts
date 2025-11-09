/**
 * Text Processing
 * Extract and process text from various file formats
 */

import pdfParse from 'pdf-parse';
import { parse as csvParse } from 'csv-parse/sync';
import MarkdownIt from 'markdown-it';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { getEnv, logger } from '@ai-agent-mastery/shared';

const md = new MarkdownIt();

/**
 * Chunk text into smaller pieces
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  if (!text) return [];

  // Clean text
  const cleaned = text.replace(/\r/g, '');

  // Split into chunks
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += chunkSize - overlap) {
    const chunk = cleaned.slice(i, i + chunkSize);
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Extract text from PDF
 */
export async function extractTextFromPDF(fileContent: Buffer): Promise<string> {
  try {
    const data = await pdfParse(fileContent);
    return data.text;
  } catch (error) {
    logger.error('PDF text extraction failed', { error });
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX
 */
export async function extractTextFromDOCX(fileContent: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileContent });
    return result.value;
  } catch (error) {
    logger.error('DOCX text extraction failed', { error });
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from Markdown
 */
export function extractTextFromMarkdown(fileContent: Buffer): string {
  const text = fileContent.toString('utf-8');
  // Convert markdown to plain text
  const html = md.render(text);
  // Strip HTML tags
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract text from plain text file
 */
export function extractTextFromPlainText(fileContent: Buffer): string {
  return fileContent.toString('utf-8');
}

/**
 * Extract text based on MIME type
 */
export async function extractTextFromFile(
  fileContent: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  logger.debug('Extracting text from file', { mimeType, filename });

  if (mimeType.includes('application/pdf')) {
    return await extractTextFromPDF(fileContent);
  } else if (mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return await extractTextFromDOCX(fileContent);
  } else if (mimeType.includes('text/markdown') || filename.endsWith('.md')) {
    return extractTextFromMarkdown(fileContent);
  } else if (mimeType.startsWith('text/')) {
    return extractTextFromPlainText(fileContent);
  } else if (mimeType.startsWith('image/')) {
    // For images, return filename (would need vision API to extract actual content)
    return `[Image: ${filename}]`;
  } else {
    // Try as plain text
    return extractTextFromPlainText(fileContent);
  }
}

/**
 * Create embeddings for text chunks
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const env = getEnv();

  try {
    const openai = new OpenAI({
      apiKey: env.EMBEDDING_API_KEY,
      baseURL: env.EMBEDDING_BASE_URL,
    });

    const response = await openai.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: texts,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    logger.error('Embedding generation failed', { error, textCount: texts.length });
    throw new Error(`Failed to create embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is tabular (CSV/Excel)
 */
export function isTabularFile(mimeType: string): boolean {
  const tabularTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.spreadsheet',
  ];

  return tabularTypes.some(type => mimeType.includes(type));
}

/**
 * Extract schema from CSV
 */
export function extractSchemaFromCSV(fileContent: Buffer): string[] {
  try {
    const text = fileContent.toString('utf-8');
    const records = csvParse(text, {
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) return [];

    return Object.keys(records[0]);
  } catch (error) {
    logger.error('CSV schema extraction failed', { error });
    return [];
  }
}

/**
 * Extract rows from CSV
 */
export function extractRowsFromCSV(fileContent: Buffer): Record<string, any>[] {
  try {
    const text = fileContent.toString('utf-8');
    const records = csvParse(text, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    });

    return records;
  } catch (error) {
    logger.error('CSV row extraction failed', { error });
    return [];
  }
}
