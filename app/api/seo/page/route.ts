import { NextRequest } from 'next/server';
import { SeoRepository } from '@/server/repositories/SeoRepository';
import { createSuccessResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || searchParams.get('path') || 'home';
    const cleanKey = key.replace(/^\//, '') || 'home';

    const pageSeo = await SeoRepository.getPageByKey(cleanKey);

    if (!pageSeo) {
      return createSuccessResponse({
        seoTitle: 'Aapla Jalgaonwala | Authentic Jalgaon Taste in Every Bite',
        seoDescription: 'Authentic Jalgaon banana chips, farsaan, kitchen masalas, and regional dry chutneys.'
      });
    }

    return createSuccessResponse(pageSeo);
  } catch (error) {
    return handleApiError(error, request, 'seo', 'GET_PAGE');
  }
}

