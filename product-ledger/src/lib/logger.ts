/**
 * Environment-aware logger utility
 * 
 * In development: Logs detailed information to console
 * In production: Sanitizes and suppresses sensitive information
 */

const isDevelopment = import.meta.env.DEV;

interface LogContext {
  code?: string;
  [key: string]: unknown;
}

/**
 * Sanitize error objects to remove sensitive information
 */
function sanitizeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      code: (error as { code?: string }).code || 'UNKNOWN',
      name: error.name,
    };
  }
  if (typeof error === 'object' && error !== null) {
    const { code, name, status } = error as Record<string, unknown>;
    return { code: String(code || 'UNKNOWN'), name: name ? String(name) : undefined, status: status ? String(status) : undefined };
  }
  return { code: 'UNKNOWN' };
}

export const logger = {
  /**
   * Log error messages - detailed in dev, sanitized in prod
   */
  error: (message: string, error?: unknown): void => {
    if (isDevelopment) {
      console.error(message, error);
    }
    // In production, we could send to an error tracking service
    // For now, we just suppress detailed logs
  },

  /**
   * Log warning messages - only in development
   */
  warn: (message: string, context?: unknown): void => {
    if (isDevelopment) {
      console.warn(message, context);
    }
  },

  /**
   * Log info messages - only in development
   */
  info: (message: string, context?: unknown): void => {
    if (isDevelopment) {
      console.info(message, context);
    }
  },

  /**
   * Log debug messages - only in development
   */
  debug: (message: string, context?: unknown): void => {
    if (isDevelopment) {
      console.debug(message, context);
    }
  },
};
