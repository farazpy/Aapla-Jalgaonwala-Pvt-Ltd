import { NextRequest } from 'next/server';
import { SeoRepository } from '@/server/repositories/SeoRepository';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { createSuccessResponse, handleApiError } from '@/server/utils/apiResponse';

export async function GET(req: NextRequest) {
  try {
    const pageSeo = await SeoRepository.getAllPages();
    const products = await ProductRepository.getAll();

    const productSeo = products.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      imageUrl: p.images[0]?.url,
      seoTitle: p.seoTitle || `${p.name} | Aapla Jalgaonwala`,
      seoDescription: p.seoDescription || p.shortDescription || p.description
    }));

    return createSuccessResponse({
      pageSeo,
      productSeo
    }, 'SEO metadata retrieved successfully');
  } catch (error) {
    return handleApiError(error, req, 'admin-seo', 'GET');
  }
}

