/**
 * Logger utility
 * Simple structured logging for the application
 */

import { getEnvVar, isProduction } from './env.js';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = getEnvVar('LOG_LEVEL');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    if (isProduction()) {
      // JSON format for production (easier to parse in log aggregators)
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    } else {
      // Human-readable format for development
      return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
    }
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log with custom level
   */
  logWithLevel(level: LogLevel, message: string, context?: LogContext): void {
    this.log(level, message, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, context?: LogContext) => {
      originalLog(level, message, { ...defaultContext, ...context });
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a logger with specific context
 */
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}
