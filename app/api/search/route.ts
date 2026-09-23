import { NextRequest } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { CategoryRepository } from '@/server/repositories/CategoryRepository';
import { createSuccessResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';

const POPULAR_SEARCHES = [
  'Banana Chips',
  'Pani Poori',
  'Masala',
  'Farsaan',
  'Bhakarwadi',
  'Peri Peri',
  'Combo'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      const categories = await CategoryRepository.getAll();
      return createSuccessResponse({
        products: [],
        categories: categories.slice(0, 4),
        popularSearches: POPULAR_SEARCHES
      });
    }

    const [products, categories] = await Promise.all([
      ProductRepository.search(q),
      CategoryRepository.getAll()
    ]);

    const matchingCategories = categories.filter(c =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.description.toLowerCase().includes(q.toLowerCase())
    );

    return createSuccessResponse(
      {
        products: products.slice(0, 8),
        categories: matchingCategories,
        popularSearches: POPULAR_SEARCHES
      },
      undefined,
      200,
      { query: q }
    );
  } catch (error) {
    return handleApiError(error, req, 'search', 'GET');
  }
}

