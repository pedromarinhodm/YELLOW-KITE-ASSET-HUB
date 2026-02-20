export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
  user_id?: string;
  flow?: string;
  operation?: string;
  duration_ms?: number;
  error?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
    
    // Sentry integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.captureException(context?.error || new Error(message), {
        extra: context,
        level: 'error',
      });
    }
  }

  /**
   * Track operation metrics (success, failure, duration)
   */
  metric(operation: string, success: boolean, durationMs: number, context?: LogContext): void {
    const logContext: LogContext = {
      ...context,
      operation,
      success,
      duration_ms: durationMs,
    };

    if (success) {
      this.info(`Operation completed: ${operation}`, logContext);
    } else {
      this.error(`Operation failed: ${operation}`, logContext);
    }
  }
}

export const logger = new Logger();
