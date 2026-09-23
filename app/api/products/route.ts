import { NextRequest } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { createSuccessResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const flavour = searchParams.get('flavour');
    const q = searchParams.get('q') || searchParams.get('search');
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const sort = searchParams.get('sort') || 'featured';

    let products = await ProductRepository.getAll();

    if (q) {
      const term = q.trim().toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.flavour && p.flavour.toLowerCase().includes(term)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term))) ||
        p.description.toLowerCase().includes(term)
      );
    }

    if (category && category !== 'all') {
      products = products.filter(p => p.category === category || p.categoryId === category);
    }

    if (flavour && flavour !== 'all') {
      const f = flavour.toLowerCase();
      products = products.filter(p => {
        if (!p.flavour && !p.tags) return false;
        const prodFlavour = (p.flavour || '').toLowerCase();
        const prodTags = (p.tags || []).map(t => t.toLowerCase());
        
        if (f === 'classic') return prodFlavour.includes('salty') || prodFlavour.includes('plain') || prodTags.includes('classic');
        if (f === 'spicy') return prodFlavour.includes('masala') || prodFlavour.includes('peri') || prodFlavour.includes('pepper') || prodTags.includes('spicy');
        if (f === 'tangy') return prodFlavour.includes('pudina') || prodFlavour.includes('tomato') || prodFlavour.includes('pani poori');
        if (f === 'cheesy') return prodFlavour.includes('cheese');
        if (f === 'fresh') return prodFlavour.includes('pudina') || prodTags.includes('fresh');
        if (f === 'experimental') return prodFlavour.includes('noodle') || prodFlavour.includes('maggi') || prodTags.includes('experimental');
        
        return prodFlavour.includes(f) || prodTags.includes(f);
      });
    }

    if (featured === 'true') {
      products = products.filter(p => p.isFeatured);
    }

    if (inStock === 'true') {
      products = products.filter(p => p.isAvailable && p.stock > 0);
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        products = products.filter(p => p.price >= min);
      }
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        products = products.filter(p => p.price <= max);
      }
    }

    // Sorting
    switch (sort) {
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'popular':
        products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'name-az':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return createSuccessResponse(products, 'Products retrieved successfully', 200, { count: products.length });
  } catch (error) {
    return handleApiError(error, req, 'products', 'GET');
  }
}

