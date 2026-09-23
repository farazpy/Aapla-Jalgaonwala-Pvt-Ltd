import { NextRequest } from 'next/server';
import { OwnersRepository } from '@/server/repositories/OwnersRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const owners = await OwnersRepository.getOwners();
    return createSuccessResponse(owners);
  } catch (error) {
    return handleApiError(error, req, 'owners', 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.name || !body.title) {
      return createErrorResponse('Name and Title are required', 'INVALID_OWNER', 400);
    }
    const created = await OwnersRepository.addOwner(body);
    return createSuccessResponse(created, 'Owner profile created', 201);
  } catch (error) {
    return handleApiError(error, req, 'owners', 'POST');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return createErrorResponse('Owner ID is required', 'INVALID_ID', 400);
    }
    const updated = await OwnersRepository.updateOwner(body.id, body);
    if (!updated) {
      return createErrorResponse('Owner not found', 'NOT_FOUND', 404);
    }
    return createSuccessResponse(updated, 'Owner profile updated');
  } catch (error) {
    return handleApiError(error, req, 'owners', 'PUT');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return createErrorResponse('Owner ID is required', 'INVALID_ID', 400);
    }
    const success = await OwnersRepository.deleteOwner(id);
    return createSuccessResponse({ success }, 'Owner profile deleted');
  } catch (error) {
    return handleApiError(error, req, 'owners', 'DELETE');
  }
}

