import { AppLog, LogLevel, LogFilters } from '@/types';
import { getDbPool } from '../database/connection';
import { readJson, writeJson } from './jsonStorage';

const FILE_NAME = 'logs.json';
const MAX_FALLBACK_LOGS = 1000;

// Reentrancy guard to strictly prevent infinite error loops
let isLoggingInternal = false;

// Sensitive keys to redact
const SENSITIVE_KEYS = new Set([
  'password',
  'pin',
  'secret',
  'token',
  'auth',
  'authorization',
  'bearer',
  'cookie',
  'creditcard',
  'cardnumber',
  'cvv',
  'key',
  'apikey',
  'api_key',
  'database_password',
  'mysqlpassword'
]);

/**
 * Recursively sanitize objects/arrays to mask sensitive data
 */
export function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 5 || data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || Array.from(SENSITIVE_KEYS).some((k) => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface LogPayload {
  level?: LogLevel;
  errorType?: string;
  message: string;
  module?: string;
  functionName?: string;
  statusCode?: number;
  requestMethod?: string;
  requestPath?: string;
  requestIp?: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export class Logger {
  /**
   * Main logging function
   */
  static async log(payload: LogPayload): Promise<AppLog> {
    const level: LogLevel = payload.level || 'info';
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createdAt = new Date().toISOString();

    const sanitizedMeta = payload.metadata ? (sanitizeData(payload.metadata) as Record<string, unknown>) : undefined;

    const logEntry: AppLog = {
      id,
      level,
      errorType: payload.errorType || (level === 'info' ? 'Info' : level === 'warn' ? 'Warning' : 'ApplicationError'),
      message: payload.message || 'Unknown event',
      module: payload.module || 'app',
      functionName: payload.functionName,
      statusCode: payload.statusCode || (level === 'error' || level === 'critical' ? 500 : 200),
      requestMethod: payload.requestMethod,
      requestPath: payload.requestPath,
      requestIp: payload.requestIp,
      userAgent: payload.userAgent,
      userId: payload.userId,
      metadata: sanitizedMeta,
      stackTrace: payload.stackTrace,
      createdAt
    };

    // Print to console with proper formatting
    const prefix = `[${createdAt}] [${level.toUpperCase()}] [${logEntry.module}${logEntry.functionName ? `:${logEntry.functionName}` : ''}]`;
    if (level === 'critical' || level === 'error') {
      console.error(`${prefix} ${logEntry.message}`);
      if (logEntry.stackTrace) console.error(logEntry.stackTrace);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${logEntry.message}`);
    } else {
      console.log(`${prefix} ${logEntry.message}`);
    }

    // Persist to MySQL and fallback storage safely
    if (!isLoggingInternal) {
      isLoggingInternal = true;
      try {
        await this.persistLog(logEntry);
      } catch (err) {
        // Safe silent fail - never crash caller
        console.warn('[Logger] Failed to persist log entry:', err);
      } finally {
        isLoggingInternal = false;
      }
    }

    return logEntry;
  }

  private static async persistLog(logEntry: AppLog): Promise<void> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO app_logs (id, level, error_type, message, module, function_name, status_code, request_method, request_path, request_ip, user_agent, user_id, metadata, stack_trace, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logEntry.id,
            logEntry.level,
            logEntry.errorType,
            logEntry.message,
            logEntry.module || null,
            logEntry.functionName || null,
            logEntry.statusCode || null,
            logEntry.requestMethod || null,
            logEntry.requestPath || null,
            logEntry.requestIp || null,
            logEntry.userAgent || null,
            logEntry.userId || null,
            logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
            logEntry.stackTrace || null,
            new Date(logEntry.createdAt)
          ]
        );
        return;
      } catch (err: any) {
        if (err?.code !== 'ER_NO_SUCH_TABLE') {
          console.warn('[Logger] MySQL insert failed, using JSON backup:', err?.message || err);
        }
      }
    }

    // Fallback to JSON file storage
    try {
      const logs = await readJson<AppLog[]>(FILE_NAME, []);
      logs.unshift(logEntry);
      if (logs.length > MAX_FALLBACK_LOGS) {
        logs.length = MAX_FALLBACK_LOGS;
      }
      await writeJson(FILE_NAME, logs);
    } catch {
      // Memory or file writing failed, proceed gracefully
    }
  }

  static async info(message: string, context?: Partial<LogPayload>): Promise<AppLog> {
    return this.log({ ...context, message, level: 'info' });
  }

  static async warn(message: string, context?: Partial<LogPayload>): Promise<AppLog> {
    return this.log({ ...context, message, level: 'warn' });
  }

  static async error(errorOrMessage: unknown, context?: Partial<LogPayload>): Promise<AppLog> {
    let message = 'An unexpected error occurred';
    let stackTrace: string | undefined;
    let errorType = context?.errorType || 'Error';

    if (errorOrMessage instanceof Error) {
      message = errorOrMessage.message;
      stackTrace = errorOrMessage.stack;
      errorType = errorOrMessage.name || errorType;
    } else if (typeof errorOrMessage === 'string') {
      message = errorOrMessage;
    } else if (errorOrMessage && typeof errorOrMessage === 'object') {
      message = JSON.stringify(sanitizeData(errorOrMessage));
    }

    return this.log({
      ...context,
      message,
      errorType,
      stackTrace: stackTrace || context?.stackTrace,
      level: 'error',
      statusCode: context?.statusCode || 500
    });
  }

  static async critical(errorOrMessage: unknown, context?: Partial<LogPayload>): Promise<AppLog> {
    let message = 'A critical system error occurred';
    let stackTrace: string | undefined;
    let errorType = context?.errorType || 'CriticalError';

    if (errorOrMessage instanceof Error) {
      message = errorOrMessage.message;
      stackTrace = errorOrMessage.stack;
      errorType = errorOrMessage.name || errorType;
    } else if (typeof errorOrMessage === 'string') {
      message = errorOrMessage;
    }

    return this.log({
      ...context,
      message,
      errorType,
      stackTrace: stackTrace || context?.stackTrace,
      level: 'critical',
      statusCode: context?.statusCode || 500
    });
  }

  /**
   * Fetch logs for Admin inspection with filtering and pagination
   */
  static async getLogs(filters: LogFilters = {}): Promise<{ logs: AppLog[]; total: number }> {
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = Math.max(0, filters.offset || 0);

    const pool = getDbPool();
    if (pool) {
      try {
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.level && filters.level !== 'all') {
          conditions.push('level = ?');
          params.push(filters.level);
        }

        if (filters.module) {
          conditions.push('module = ?');
          params.push(filters.module);
        }

        if (filters.search) {
          conditions.push('(message LIKE ? OR error_type LIKE ? OR request_path LIKE ?)');
          const term = `%${filters.search.trim()}%`;
          params.push(term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [countRows]: any = await pool.query(`SELECT COUNT(*) as count FROM app_logs ${whereClause}`, params);
        const total = Array.isArray(countRows) && countRows[0] ? Number(countRows[0].count) : 0;

        const [rows]: any = await pool.query(
          `SELECT * FROM app_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        if (Array.isArray(rows)) {
          const logs: AppLog[] = rows.map((r: any) => ({
            id: r.id,
            level: r.level,
            errorType: r.error_type,
            message: r.message,
            module: r.module || undefined,
            functionName: r.function_name || undefined,
            statusCode: r.status_code ? Number(r.status_code) : undefined,
            requestMethod: r.request_method || undefined,
            requestPath: r.request_path || undefined,
            requestIp: r.request_ip || undefined,
            userAgent: r.user_agent || undefined,
            userId: r.user_id || undefined,
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
            stackTrace: r.stack_trace || undefined,
            createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
          }));
          return { logs, total };
        }
      } catch (err) {
        console.warn('[Logger] Error fetching logs from DB:', err);
      }
    }

    // Fallback
    const logs = await readJson<AppLog[]>(FILE_NAME, []);
    let filtered = logs;

    if (filters.level && filters.level !== 'all') {
      filtered = filtered.filter((l) => l.level === filters.level);
    }
    if (filters.module) {
      filtered = filtered.filter((l) => l.module === filters.module);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((l) => l.message.toLowerCase().includes(s) || l.errorType.toLowerCase().includes(s));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return { logs: paginated, total };
  }

  /**
   * Clear all logs or delete logs older than X days
   */
  static async clearLogs(olderThanDays?: number): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        if (olderThanDays && olderThanDays > 0) {
          await pool.query('DELETE FROM app_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [olderThanDays]);
        } else {
          await pool.query('DELETE FROM app_logs');
        }
      } catch (err) {
        console.warn('[Logger] Error deleting logs from DB:', err);
      }
    }

    if (!olderThanDays) {
      await writeJson(FILE_NAME, []);
    }
    return true;
  }
}
