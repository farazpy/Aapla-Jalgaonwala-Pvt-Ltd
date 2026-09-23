import { NextRequest } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !body.seoTitle || !body.seoDescription) {
      return createErrorResponse('SEO Title and Description are required', 'VALIDATION_FAILED', 400);
    }

    const updated = await ProductRepository.update(id, {
      seoTitle: String(body.seoTitle).trim(),
      seoDescription: String(body.seoDescription).trim()
    });

    if (!updated) {
      return createErrorResponse('Product not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse({
      id: updated.id,
      name: updated.name,
      seoTitle: updated.seoTitle,
      seoDescription: updated.seoDescription
    }, 'Product SEO updated successfully');
  } catch (error) {
    return handleApiError(error, request, 'admin-seo-product', 'PUT');
  }
}

