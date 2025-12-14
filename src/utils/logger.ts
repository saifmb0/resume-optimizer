/**
 * Structured logging interface for application-wide logging
 * 
 * This abstraction allows swapping console logging with production-grade
 * logging libraries (e.g., pino, winston) without changing application code.
 */

export interface Logger {
  /**
   * Log informational messages
   */
  info(message: string, meta?: Record<string, unknown>): void

  /**
   * Log warning messages
   */
  warn(message: string, meta?: Record<string, unknown>): void

  /**
   * Log error messages
   */
  error(message: string, meta?: Record<string, unknown>): void

  /**
   * Log debug messages (disabled in production)
   */
  debug(message: string, meta?: Record<string, unknown>): void
}

/**
 * Console-based logger implementation
 * Default implementation suitable for development and basic production use
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly context?: string) {}

  info(message: string, meta?: Record<string, unknown>): void {
    const prefix = this.context ? `[${this.context}] ` : ''
    if (meta && Object.keys(meta).length > 0) {
      console.log(`${prefix}${message}`, meta)
    } else {
      console.log(`${prefix}${message}`)
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    const prefix = this.context ? `[${this.context}] ` : ''
    if (meta && Object.keys(meta).length > 0) {
      console.warn(`${prefix}${message}`, meta)
    } else {
      console.warn(`${prefix}${message}`)
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    const prefix = this.context ? `[${this.context}] ` : ''
    if (meta && Object.keys(meta).length > 0) {
      console.error(`${prefix}${message}`, meta)
    } else {
      console.error(`${prefix}${message}`)
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'production') {
      return // Skip debug logs in production
    }

    const prefix = this.context ? `[${this.context}] ` : ''
    if (meta && Object.keys(meta).length > 0) {
      console.debug(`${prefix}${message}`, meta)
    } else {
      console.debug(`${prefix}${message}`)
    }
  }
}

/**
 * Factory function to create a logger instance
 * 
 * @param context - Optional context identifier (e.g., "SecurityLogger", "API")
 * @returns Logger instance
 * 
 * @example
 * const logger = createLogger('SecurityLogger')
 * logger.warn('Suspicious activity detected', { ip: '192.168.1.1' })
 */
export function createLogger(context?: string): Logger {
  return new ConsoleLogger(context)
}

/**
 * Default logger instance for general use
 */
export const defaultLogger = createLogger()
