import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await ProductRepository.getBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const recommendations = await ProductRepository.getRecommendations(product.id, 4);

    return NextResponse.json({
      success: true,
      data: {
        product,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch product' } },
      { status: 500 }
    );
  }
}
