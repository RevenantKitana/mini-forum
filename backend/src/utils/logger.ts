/**
 * Logger utility for backend services
 * Provides structured logging with consistent formatting
 * 
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Database error', { error: err.message });
 * logger.warn('High memory usage detected');
 * logger.debug('Query executed', { query: sql, duration: 45 });
 * ```
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: any;
}

/**
 * Format log message with timestamp and context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context && Object.keys(context).length > 0 
    ? ` | ${JSON.stringify(context)}`
    : '';
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Get color code for console output (for development)
 */
function getColorCode(level: LogLevel): string {
  switch (level) {
    case LogLevel.ERROR:
      return '\x1b[31m'; // Red
    case LogLevel.WARN:
      return '\x1b[33m'; // Yellow
    case LogLevel.INFO:
      return '\x1b[36m'; // Cyan
    case LogLevel.DEBUG:
      return '\x1b[35m'; // Magenta
    default:
      return '\x1b[0m'; // Reset
  }
}

const resetColor = '\x1b[0m';

/**
 * Logger class for backend services
 * Provides methods for different log levels
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    const formatted = formatLog(LogLevel.DEBUG, message, context);
    if (this.isDevelopment) {
      console.log(`${getColorCode(LogLevel.DEBUG)}${formatted}${resetColor}`);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const formatted = formatLog(LogLevel.INFO, message, context);
    console.log(`${getColorCode(LogLevel.INFO)}${formatted}${resetColor}`);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const formatted = formatLog(LogLevel.WARN, message, context);
    console.warn(`${getColorCode(LogLevel.WARN)}${formatted}${resetColor}`);
  }

  /**
   * Log error message with error object
   */
  error(message: string, error?: Error | string | LogContext, context?: LogContext): void {
    let errorContext = context || {};
    
    if (error instanceof Error) {
      errorContext = {
        ...errorContext,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      };
    } else if (typeof error === 'string') {
      errorContext = { ...errorContext, error };
    } else if (error && typeof error === 'object') {
      errorContext = { ...errorContext, ...error };
    }

    const formatted = formatLog(LogLevel.ERROR, message, errorContext);
    console.error(`${getColorCode(LogLevel.ERROR)}${formatted}${resetColor}`);
  }

  /**
   * Log API request/response
   */
  api(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const logContext = {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...context,
    };
    
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const formatted = formatLog(level, `API Request`, logContext);
    
    if (level === LogLevel.WARN) {
      console.warn(`${getColorCode(level)}${formatted}${resetColor}`);
    } else {
      console.log(`${getColorCode(level)}${formatted}${resetColor}`);
    }
  }

  /**
   * Log database query
   */
  query(operation: string, table: string, duration: number, context?: LogContext): void {
    const logContext = {
      operation,
      table,
      duration: `${duration}ms`,
      ...context,
    };
    const formatted = formatLog(LogLevel.DEBUG, `Database Query`, logContext);
    if (this.isDevelopment) {
      console.log(`${getColorCode(LogLevel.DEBUG)}${formatted}${resetColor}`);
    }
  }
}

export const logger = new Logger();
