import { NextRequest } from 'next/server';
import { SettingsRepository } from '@/server/repositories/SettingsRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function GET(req: NextRequest) {
  try {
    const settings = await SettingsRepository.getSettings();
    return createSuccessResponse(settings, 'Settings retrieved successfully');
  } catch (error) {
    return handleApiError(error, req, 'settings', 'GET');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid settings payload', 'INVALID_PAYLOAD', 400);
    }
    const updated = await SettingsRepository.updateSettings(body);
    return createSuccessResponse(updated, 'Settings updated successfully');
  } catch (error) {
    return handleApiError(error, req, 'settings', 'PUT');
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}

