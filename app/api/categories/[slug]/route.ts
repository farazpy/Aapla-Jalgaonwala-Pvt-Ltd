import { NextRequest, NextResponse } from 'next/server';
import { CategoryRepository } from '@/server/repositories/CategoryRepository';
import { ProductRepository } from '@/server/repositories/ProductRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const category = await CategoryRepository.getBySlug(slug);

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    const products = await ProductRepository.getByCategory(slug);

    return NextResponse.json({
      success: true,
      data: {
        category,
        products
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch category' } },
      { status: 500 }
    );
  }
}
