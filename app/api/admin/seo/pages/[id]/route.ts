import { NextRequest } from 'next/server';
import { SeoRepository } from '@/server/repositories/SeoRepository';
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

    const updated = await SeoRepository.updatePage(id, {
      seoTitle: String(body.seoTitle).trim(),
      seoDescription: String(body.seoDescription).trim(),
      keywords: body.keywords ? String(body.keywords).trim() : undefined,
      ogImage: body.ogImage ? String(body.ogImage).trim() : undefined
    });

    if (!updated) {
      return createErrorResponse('Page SEO record not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse(updated, 'Page SEO updated successfully');
  } catch (error) {
    return handleApiError(error, request, 'admin-seo-page', 'PUT');
  }
}

