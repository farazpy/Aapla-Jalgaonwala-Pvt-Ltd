import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/server/utils/logger';
import { LogFilters, LogLevel } from '@/types';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = (searchParams.get('level') || 'all') as LogLevel | 'all';
    const moduleName = searchParams.get('module') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit') || 50);
    const offset = Number(searchParams.get('offset') || 0);

    const filters: LogFilters = {
      level,
      module: moduleName,
      search,
      limit,
      offset
    };

    const result = await Logger.getLogs(filters);
    return createSuccessResponse(result.logs, 'Logs retrieved successfully', 200, { total: result.total });
  } catch (error) {
    return handleApiError(error, req, 'logs', 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { level = 'error', message, errorType, module = 'client', functionName, metadata, stackTrace } = body;

    if (!message || typeof message !== 'string') {
      return createErrorResponse('Log message is required', 'VALIDATION_ERROR', 400);
    }

    const requestIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const log = await Logger.log({
      level,
      message: message.slice(0, 2000), // Protect against excessively large payloads
      errorType: (errorType || 'ClientError').slice(0, 128),
      module: (module || 'client').slice(0, 128),
      functionName: functionName ? String(functionName).slice(0, 128) : undefined,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : undefined,
      stackTrace: stackTrace ? String(stackTrace).slice(0, 5000) : undefined,
      requestIp,
      userAgent
    });

    return createSuccessResponse({ id: log.id, logged: true }, 'Log recorded successfully', 201);
  } catch (error) {
    return handleApiError(error, req, 'logs', 'POST');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const olderThanDays = searchParams.get('days') ? Number(searchParams.get('days')) : undefined;

    await Logger.clearLogs(olderThanDays);
    return createSuccessResponse({ cleared: true }, 'Logs cleared successfully');
  } catch (error) {
    return handleApiError(error, req, 'logs', 'DELETE');
  }
}
