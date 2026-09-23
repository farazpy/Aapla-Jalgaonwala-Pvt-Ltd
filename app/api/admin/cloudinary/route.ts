import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryAssetRepository } from '@/server/repositories/CloudinaryAssetRepository';
import { ProductRepository } from '@/server/repositories/ProductRepository';
import { CategoryRepository } from '@/server/repositories/CategoryRepository';
import { getCloudinaryClient } from '@/server/utils/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

// GET all assets or check linked entities for safety warnings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkLink = searchParams.get('checkLink') === 'true';
    const url = searchParams.get('url');
    const urlsParam = searchParams.get('urls');

    if (checkLink && (url || urlsParam)) {
      let urls: string[] = [];
      if (urlsParam) {
        try {
          urls = JSON.parse(urlsParam);
        } catch {
          urls = urlsParam.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (url) {
        urls = [url];
      }

      const linked = await CloudinaryAssetRepository.getLinkedEntities(urls);
      return NextResponse.json({
        success: true,
        linked
      }, {
        headers: NO_CACHE_HEADERS
      });
    }

    const forceSync = searchParams.get('sync') === 'true';
    const assets = await CloudinaryAssetRepository.getAll(forceSync);
    return NextResponse.json({
      success: true,
      data: assets,
      count: assets.length
    }, {
      headers: NO_CACHE_HEADERS
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/cloudinary:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch Cloudinary asset information'
    }, { 
      status: 500,
      headers: NO_CACHE_HEADERS
    });
  }
}

// POST to assign an asset to a product or category directly
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, url, productId, categoryId } = body;

    if (action !== 'assign' || !url) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action or missing asset URL'
      }, { status: 400 });
    }

    if (productId) {
      const product = await ProductRepository.getById(productId);
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      // Update product's primary image (images[0])
      const currentImages = product.images || [];
      const updatedImages = [
        {
          id: currentImages[0]?.id || `img-${productId}-0`,
          url: url,
          alt: product.name,
          isPrimary: true
        },
        ...currentImages.slice(1).map(img => ({ ...img, isPrimary: false }))
      ];

      await ProductRepository.update(productId, { images: updatedImages });
      return NextResponse.json({
        success: true,
        message: `Successfully set image for product: ${product.name}`
      });
    }

    if (categoryId) {
      const success = await CategoryRepository.updateImage(categoryId, url);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Successfully set image for category`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Please specify either a productId or a categoryId to assign the media'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error in POST /api/admin/cloudinary:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to assign Cloudinary asset'
    }, { status: 500 });
  }
}

// DELETE asset(s) from both Cloudinary cloud and DB/JSON tracking
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let ids: string[] = [];

    // Check if body contains JSON with ids array
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        if (Array.isArray(body.ids) && body.ids.length > 0) {
          ids = body.ids;
        }
      } catch {
        // Ignore JSON parse failure and fallback to params
      }
    }

    if (ids.length === 0) {
      const singleId = searchParams.get('id');
      const idsParam = searchParams.get('ids');
      if (idsParam) {
        ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
      } else if (singleId) {
        ids = [singleId];
      }
    }

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing asset ID(s) parameter' }, { status: 400 });
    }

    // 1. Fetch tracked assets to get public_ids
    const allAssets = await CloudinaryAssetRepository.getAll();
    const idSet = new Set(ids);
    const targetAssets = allAssets.filter(a => idSet.has(a.id) || ids.includes(a.id));

    if (targetAssets.length === 0) {
      return NextResponse.json({ success: false, error: 'No matching assets found in media library' }, { status: 404 });
    }

    // 2. Extract publicIds for Cloudinary cloud purge
    const publicIds = targetAssets.map(a => a.publicId).filter(Boolean) as string[];

    if (publicIds.length > 0) {
      const client = await getCloudinaryClient();
      if (client) {
        try {
          // Attempt batch delete via Cloudinary API
          if (client.api && typeof client.api.delete_resources === 'function') {
            await client.api.delete_resources(publicIds);
            console.log(`[Cloudinary API] Bulk destroyed ${publicIds.length} assets in Cloudinary cloud.`);
          } else {
            // Fallback to individual destroy calls
            for (const pId of publicIds) {
              await client.uploader.destroy(pId).catch(err => {
                console.warn(`Failed destroying publicId ${pId}:`, err);
              });
            }
          }
        } catch (cloudErr) {
          console.warn('Cloudinary bulk cloud deletion warning, proceeding to untrack locally anyway:', cloudErr);
        }
      }
    }

    // 3. Remove tracking records
    const targetIds = targetAssets.map(a => a.id);
    await CloudinaryAssetRepository.deleteAssets(targetIds);

    return NextResponse.json({
      success: true,
      count: targetIds.length,
      message: `Successfully removed ${targetIds.length} asset(s) from media library`
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/cloudinary:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete asset(s)'
    }, { status: 500 });
  }
}
