import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.ids) || body.ids.length === 0 || !body.updates) {
      return createErrorResponse('Product IDs (array) and updates object are required.', 'VALIDATION_FAILED', 400);
    }

    const { ids, updates } = body;

    // Filter out only valid updatable fields to prevent any corruption
    const cleanUpdates: any = {};
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.netQuantity !== undefined) cleanUpdates.netQuantity = updates.netQuantity;
    if (updates.price !== undefined) cleanUpdates.price = Number(updates.price);
    if (updates.mrp !== undefined) cleanUpdates.mrp = Number(updates.mrp);
    if (updates.profit !== undefined) cleanUpdates.profit = Number(updates.profit);
    if (updates.stock !== undefined) cleanUpdates.stock = Number(updates.stock);
    if (updates.isFeatured !== undefined) cleanUpdates.isFeatured = Boolean(updates.isFeatured);
    if (updates.isBestSeller !== undefined) cleanUpdates.isBestSeller = Boolean(updates.isBestSeller);
    if (updates.isNew !== undefined) cleanUpdates.isNew = Boolean(updates.isNew);
    if (updates.isAvailable !== undefined) cleanUpdates.isAvailable = Boolean(updates.isAvailable);
    if (updates.flavour !== undefined) cleanUpdates.flavour = updates.flavour;
    if (updates.variants !== undefined) cleanUpdates.variants = updates.variants;
    if (updates.variantConfig !== undefined) cleanUpdates.variantConfig = updates.variantConfig;
    if (updates.tags !== undefined) {
      cleanUpdates.tags = Array.isArray(updates.tags) 
        ? updates.tags 
        : typeof updates.tags === 'string' 
          ? updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];
    }

    const updatedProducts = [];
    for (const id of ids) {
      const updated = await ProductRepository.update(id, cleanUpdates);
      if (updated) {
        updatedProducts.push(updated);
      }
    }

    return createSuccessResponse(
      updatedProducts,
      `Successfully bulk updated ${updatedProducts.length} products.`
    );
  } catch (err) {
    return handleApiError(err, req, 'admin-products-bulk', 'PUT');
  }
}
