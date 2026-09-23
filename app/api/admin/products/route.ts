import { NextRequest } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const products = await ProductRepository.getAll(true);
    const response = createSuccessResponse(products);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  } catch (err) {
    return handleApiError(err, req, 'admin-products', 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.name || body.price === undefined) {
      return createErrorResponse('Product name and price are required.', 'VALIDATION_FAILED', 400);
    }

    const createdProduct = await ProductRepository.create(body);

    return createSuccessResponse(
      createdProduct,
      'Product created successfully in database',
      201
    );
  } catch (err) {
    return handleApiError(err, req, 'admin-products', 'POST');
  }
}

