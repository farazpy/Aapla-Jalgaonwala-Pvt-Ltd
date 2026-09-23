import { NextRequest, NextResponse } from 'next/server';
import { enhanceProductDetails, EnhanceProductInput } from '@/server/utils/gemini';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.name) {
      return createErrorResponse('Product name is required for AI enhancement.', 'VALIDATION_FAILED', 400);
    }

    const input: EnhanceProductInput = {
      name: body.name.trim(),
      category: body.category,
      prepStyle: body.prepStyle,
      flavorNotes: body.flavorNotes,
      targetAudience: body.targetAudience,
      dietaryCallouts: body.dietaryCallouts,
      currentDescription: body.description,
      currentShortDescription: body.shortDescription,
      currentSeoTitle: body.seoTitle,
      currentSeoDescription: body.seoDescription
    };

    const enhanced = await enhanceProductDetails(input);

    return createSuccessResponse(enhanced, 'Product content enhanced successfully using Gemini AI.');
  } catch (error) {
    return handleApiError(error, req, 'admin-products-ai-enhance', 'POST');
  }
}
