/**
 * Logger utility for backend services.
 * In production emits newline-delimited JSON (structured logging).
 * In development emits colored, human-readable text.
 *
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 *
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Database error', { error: err.message });
 * logger.warn('High memory usage detected');
 * logger.debug('Query executed', { query: sql, duration: 45 });
 * logger.info('Request handled', { requestId: req.requestId });
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

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Emit a JSON-structured log line (production mode).
 */
function emitJson(level: LogLevel, message: string, context?: LogContext): void {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: 'backend',
    message,
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === LogLevel.ERROR || level === LogLevel.WARN) {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

/**
 * Format log message with timestamp and context (development mode).
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

  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    if (IS_PRODUCTION) {
      emitJson(LogLevel.DEBUG, message, context);
    } else {
      const formatted = formatLog(LogLevel.DEBUG, message, context);
      console.log(`${getColorCode(LogLevel.DEBUG)}${formatted}${resetColor}`);
    }
  }

  info(message: string, context?: LogContext): void {
    if (IS_PRODUCTION) {
      emitJson(LogLevel.INFO, message, context);
    } else {
      const formatted = formatLog(LogLevel.INFO, message, context);
      console.log(`${getColorCode(LogLevel.INFO)}${formatted}${resetColor}`);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (IS_PRODUCTION) {
      emitJson(LogLevel.WARN, message, context);
    } else {
      const formatted = formatLog(LogLevel.WARN, message, context);
      console.warn(`${getColorCode(LogLevel.WARN)}${formatted}${resetColor}`);
    }
  }

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

    if (IS_PRODUCTION) {
      emitJson(LogLevel.ERROR, message, errorContext);
    } else {
      const formatted = formatLog(LogLevel.ERROR, message, errorContext);
      console.error(`${getColorCode(LogLevel.ERROR)}${formatted}${resetColor}`);
    }
  }

  api(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const logContext = {
      method,
      path,
      statusCode,
      duration_ms: duration,
      ...context,
    };
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    if (IS_PRODUCTION) {
      emitJson(level, 'http_request', logContext);
    } else {
      const formatted = formatLog(level, 'API Request', logContext);
      if (level === LogLevel.WARN) {
        console.warn(`${getColorCode(level)}${formatted}${resetColor}`);
      } else {
        console.log(`${getColorCode(level)}${formatted}${resetColor}`);
      }
    }
  }

  query(operation: string, table: string, duration: number, context?: LogContext): void {
    const logContext = { operation, table, duration_ms: duration, ...context };
    if (IS_PRODUCTION) {
      emitJson(LogLevel.DEBUG, 'db_query', logContext);
    } else if (this.isDevelopment) {
      const formatted = formatLog(LogLevel.DEBUG, 'Database Query', logContext);
      console.log(`${getColorCode(LogLevel.DEBUG)}${formatted}${resetColor}`);
    }
  }

  slowQuery(query: string, duration: number, context?: LogContext): void {
    const logContext = { query: query.slice(0, 200), duration_ms: duration, ...context };
    if (IS_PRODUCTION) {
      emitJson(LogLevel.WARN, 'slow_query', logContext);
    } else {
      const formatted = formatLog(LogLevel.WARN, 'SLOW QUERY', logContext);
      console.warn(`${getColorCode(LogLevel.WARN)}${formatted}${resetColor}`);
    }
  }
}

export const logger = new Logger();

