/**
 * Frontend Logger utility for client-side logging
 * Provides structured logging with console styling
 * 
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('Component mounted');
 * logger.warn('API request took too long', { duration: 5000 });
 * logger.error('Failed to fetch posts', error);
 * logger.debug('Render state updated', { newState: {} });
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

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Format log message with timestamp
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
}

/**
 * Get console styling for each log level
 */
function getConsoleStyle(level: LogLevel): { color: string; icon: string } {
  switch (level) {
    case LogLevel.ERROR:
      return { color: '#ef4444', icon: '❌' };
    case LogLevel.WARN:
      return { color: '#f59e0b', icon: '⚠️' };
    case LogLevel.INFO:
      return { color: '#3b82f6', icon: 'ℹ️' };
    case LogLevel.DEBUG:
      return { color: '#8b5cf6', icon: '🔍' };
    default:
      return { color: '#6b7280', icon: '📝' };
  }
}

/**
 * Frontend Logger class for client-side services
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  /**
   * Store log entry in memory
   */
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    const entry = formatLog(LogLevel.DEBUG, message, context);
    this.addLogEntry(entry);
    
    if (this.isDevelopment) {
      const { color, icon } = getConsoleStyle(LogLevel.DEBUG);
      console.debug(
        `%c${icon} [${entry.timestamp}] ${message}`,
        `color: ${color}; font-weight: bold;`,
        context || ''
      );
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const entry = formatLog(LogLevel.INFO, message, context);
    this.addLogEntry(entry);
    
    const { color, icon } = getConsoleStyle(LogLevel.INFO);
    console.info(
      `%c${icon} [${entry.timestamp}] ${message}`,
      `color: ${color}; font-weight: bold;`,
      context || ''
    );
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const entry = formatLog(LogLevel.WARN, message, context);
    this.addLogEntry(entry);
    
    const { color, icon } = getConsoleStyle(LogLevel.WARN);
    console.warn(
      `%c${icon} [${entry.timestamp}] ${message}`,
      `color: ${color}; font-weight: bold;`,
      context || ''
    );
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | string | LogContext, context?: LogContext): void {
    let errorContext = context || {};
    
    if (error instanceof Error) {
      errorContext = {
        ...errorContext,
        errorName: error.name,
        errorMessage: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    } else if (typeof error === 'string') {
      errorContext = { ...errorContext, error };
    } else if (error && typeof error === 'object') {
      errorContext = { ...errorContext, ...error };
    }

    const entry = formatLog(LogLevel.ERROR, message, errorContext);
    this.addLogEntry(entry);
    
    const { color, icon } = getConsoleStyle(LogLevel.ERROR);
    console.error(
      `%c${icon} [${entry.timestamp}] ${message}`,
      `color: ${color}; font-weight: bold;`,
      errorContext || ''
    );
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
    const entry = formatLog(level, `API ${method} ${path}`, logContext);
    this.addLogEntry(entry);
    
    const { color, icon } = getConsoleStyle(level);
    console.log(
      `%c${icon} [${entry.timestamp}] ${method} ${path} ${statusCode}`,
      `color: ${color}; font-weight: bold;`,
      `${duration}ms`,
      context || ''
    );
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

// Export logs to window for debugging (development only)
if (import.meta.env.DEV) {
  (window as any).__logs__ = () => logger.getLogs();
  (window as any).__exportLogs__ = () => logger.exportLogs();
}
