import config from './env';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'security';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = config.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    console.error(this.formatMessage('error', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  // Security logging - never log sensitive data
  security(message: string, meta?: any): void {
    // Remove sensitive fields from meta
    const safeMeta = meta ? this.sanitizeMeta(meta) : undefined;
    console.error(this.formatMessage('security', message, safeMeta));
  }

  private sanitizeMeta(meta: any): any {
    const sensitiveKeys = ['password', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'MTN_API_SECRET', 'AIRTEL_CLIENT_SECRET', 'OPENAI_API_KEY'];
    const sanitized = { ...meta };
    
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}

const logger = new Logger();

export default logger;
