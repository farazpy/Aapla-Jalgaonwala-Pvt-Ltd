import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const pin = body?.pin;

    const ADMIN_PIN = process.env.ADMIN_PIN || '9890';

    if (pin && String(pin).trim() === ADMIN_PIN) {
      return createSuccessResponse({
        authenticated: true,
        role: 'admin',
        timestamp: new Date().toISOString()
      }, 'Admin authentication successful');
    }

    return createErrorResponse('Invalid Admin PIN', 'AUTH_FAILED', 401);
  } catch (err) {
    return handleApiError(err, req, 'admin-auth', 'VERIFY_PIN');
  }
}

