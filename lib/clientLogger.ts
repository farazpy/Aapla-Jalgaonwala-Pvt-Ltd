'use client';

// In-memory set to deduplicate rapid duplicate client error reports within 5 seconds
const recentlyLogged = new Map<string, number>();

export interface ClientLogContext {
  module?: string;
  functionName?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export class ClientLogger {
  private static shouldThrottle(signature: string): boolean {
    const now = Date.now();
    const lastTime = recentlyLogged.get(signature);
    if (lastTime && now - lastTime < 5000) {
      return true;
    }
    recentlyLogged.set(signature, now);

    // Keep map bounded
    if (recentlyLogged.size > 100) {
      for (const [key, timestamp] of recentlyLogged.entries()) {
        if (now - timestamp > 10000) recentlyLogged.delete(key);
      }
    }
    return false;
  }

  static async log(
    level: 'info' | 'warn' | 'error' | 'critical',
    message: string,
    context?: ClientLogContext
  ): Promise<void> {
    const signature = `${level}:${message}:${context?.module || ''}`;
    if (this.shouldThrottle(signature)) return;

    if (typeof window === 'undefined') return;

    try {
      const payload = {
        level,
        message,
        errorType: 'ClientError',
        module: context?.module || 'browser',
        functionName: context?.functionName,
        metadata: {
          ...context?.metadata,
          url: window.location.href,
          pathname: window.location.pathname,
          referrer: document.referrer || undefined,
          screen: `${window.innerWidth}x${window.innerHeight}`
        },
        stackTrace: context?.stackTrace
      };

      // Fire and forget via fetch
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {
        // Silently ignore network logging failures
      });
    } catch {
      // Never throw from client logger
    }
  }

  static error(errorOrMsg: unknown, context?: ClientLogContext): void {
    let message = 'An unknown client error occurred';
    let stackTrace: string | undefined;

    if (errorOrMsg instanceof Error) {
      message = errorOrMsg.message;
      stackTrace = errorOrMsg.stack;
    } else if (typeof errorOrMsg === 'string') {
      message = errorOrMsg;
    }

    console.error(`[Client Error]`, message, context || '');
    this.log('error', message, { ...context, stackTrace: stackTrace || context?.stackTrace });
  }

  static warn(message: string, context?: ClientLogContext): void {
    console.warn(`[Client Warn]`, message, context || '');
    this.log('warn', message, context);
  }

  static info(message: string, context?: ClientLogContext): void {
    console.info(`[Client Info]`, message, context || '');
    this.log('info', message, context);
  }
}
