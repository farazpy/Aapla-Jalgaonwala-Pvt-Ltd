import { NextRequest } from 'next/server';
import { CategoryRepository } from '@/server/repositories/CategoryRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function GET(req: NextRequest) {
  try {
    const categories = await CategoryRepository.getAll();
    return createSuccessResponse(categories, 'Categories retrieved successfully', 200, { count: categories.length });
  } catch (error) {
    return handleApiError(error, req, 'categories', 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.name || typeof body.name !== 'string') {
      return createErrorResponse('Category name is required', 'INVALID_INPUT', 400);
    }

    const category = await CategoryRepository.create({
      name: body.name.trim(),
      slug: body.slug ? body.slug.trim() : undefined,
      description: body.description ? body.description.trim() : undefined,
      image: body.image ? body.image.trim() : undefined
    });

    return createSuccessResponse(category, 'Category created successfully', 201);
  } catch (error) {
    return handleApiError(error, req, 'categories', 'POST');
  }
}

