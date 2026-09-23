import { Logger } from './logger';
import type { Request } from 'express';

export interface ApiSuccessPayload<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    message: string;
    code?: string;
    referenceId?: string;
    details?: unknown;
  };
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): ApiSuccessPayload<T> {
  const payload: ApiSuccessPayload<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };
  return payload;
}

export function createErrorResponse(
  userMessage: string,
  code = 'OPERATION_FAILED',
  referenceId?: string,
  details?: unknown
): ApiErrorPayload {
  const payload: ApiErrorPayload = {
    success: false,
    error: {
      message: userMessage,
      code,
      ...(referenceId && { referenceId }),
      ...(details !== undefined && { details })
    }
  };
  return payload;
}

/**
 * Universal error handler for API Routes.
 * Safely logs internal details (including stack traces and DB errors) to MySQL/fallback,
 * while returning clean, sanitized, friendly responses to client.
 */
export async function handleApiError(
  error: unknown,
  req?: Request,
  moduleName = 'api',
  functionName?: string
): Promise<{ payload: ApiErrorPayload; statusCode: number }> {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let userMessage = 'An unexpected error occurred. Please try again or contact support.';

  let requestMethod: string | undefined;
  let requestPath: string | undefined;
  let requestIp: string | undefined;
  let userAgent: string | undefined;

  if (req) {
    requestMethod = req.method;
    requestPath = req.originalUrl || req.url;
    requestIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.headers['x-real-ip'] as string || req.ip || undefined;
    userAgent = req.headers['user-agent'] || undefined;
  }

  // Determine error characteristics
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('not found') || errorMsg.includes('enoent')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      userMessage = 'The requested resource was not found.';
    } else if (errorMsg.includes('unauthorized') || errorMsg.includes('invalid pin') || errorMsg.includes('forbidden')) {
      statusCode = 401;
      errorCode = 'UNAUTHORIZED';
      userMessage = 'You are not authorized to perform this operation.';
    } else if (errorMsg.includes('validation') || errorMsg.includes('invalid') || errorMsg.includes('required')) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      userMessage = error.message; // Safe validation message
    } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      statusCode = 504;
      errorCode = 'GATEWAY_TIMEOUT';
      userMessage = 'The request timed out. Please try again shortly.';
    } else if (errorMsg.includes('econnrefused') || errorMsg.includes('database') || errorMsg.includes('mysql')) {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      userMessage = 'Service is temporarily experiencing high load. Please try again.';
    }
  }

  // Persist full detailed log securely to DB
  const log = await Logger.error(error, {
    module: moduleName,
    functionName,
    statusCode,
    requestMethod,
    requestPath,
    requestIp,
    userAgent
  });

  return {
    payload: createErrorResponse(userMessage, errorCode, log.id),
    statusCode
  };
}
