import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { OrderRepository } from '@/server/repositories/OrderRepository';
import { createSuccessResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const products = await ProductRepository.getAll(true);
    const orders = await OrderRepository.getAll();

    const totalProducts = products.length;
    const outOfStock = products.filter(p => !p.isAvailable || p.stock === 0).length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    const response = createSuccessResponse({
      totalProducts,
      outOfStock,
      totalOrders,
      totalRevenue,
      pendingOrders
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  } catch (err) {
    return handleApiError(err, req, 'admin-stats', 'GET');
  }
}

