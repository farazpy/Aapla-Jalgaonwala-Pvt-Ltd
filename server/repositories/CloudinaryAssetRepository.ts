import { v2 as cloudinary } from 'cloudinary';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { ProductRepository } from './ProductRepository';
import { CategoryRepository } from './CategoryRepository';
import { SettingsRepository } from './SettingsRepository';
import { addCloudinaryOriginalFlag } from '../utils/cloudinary';

export interface CloudinaryAsset {
  id: string;
  url: string;
  publicId?: string;
  name: string;
  bytes?: number;
  format?: string;
  createdAt: string;
}

const ASSETS_FILE = 'cloudinary_assets.json';

export class CloudinaryAssetRepository {
  private static async fetchFromCloudinaryApi(): Promise<CloudinaryAsset[]> {
    let cloudName = '';
    let apiKey = '';
    let apiSecret = '';

    try {
      const settings = await SettingsRepository.get();
      if ((settings as any).cloudinaryCloudName) cloudName = (settings as any).cloudinaryCloudName;
      if ((settings as any).cloudinaryApiKey) apiKey = (settings as any).cloudinaryApiKey;
      if ((settings as any).cloudinaryApiSecret) apiSecret = (settings as any).cloudinaryApiSecret;
    } catch {
      // Ignore settings fetch errors
    }

    if (!cloudName) cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    if (!apiKey) apiKey = process.env.CLOUDINARY_API_KEY || '';
    if (!apiSecret) apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!cloudName || !apiKey || !apiSecret) {
      return [];
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const assets: CloudinaryAsset[] = [];
    const resourceTypes = ['image', 'video'];

    for (const resType of resourceTypes) {
      let nextCursor: string | undefined = undefined;
      do {
        try {
          const options: any = {
            max_results: 500,
            resource_type: resType,
          };
          if (nextCursor) {
            options.next_cursor = nextCursor;
          }

          const res: any = await cloudinary.api.resources(options);
          if (res && res.resources && Array.isArray(res.resources)) {
            for (const r of res.resources) {
              const publicId = r.public_id;
              const fileName = publicId ? publicId.split('/').pop() : 'Cloudinary Media';
              const rawUrl = r.secure_url || r.url;
              const isImage = resType === 'image' || (!rawUrl.includes('/video/') && !rawUrl.includes('/raw/'));
              const formattedUrl = isImage ? addCloudinaryOriginalFlag(rawUrl) : rawUrl;
              assets.push({
                id: r.asset_id || `as_${publicId.replace(/[^a-zA-Z0-9]/g, '_')}`,
                url: formattedUrl,
                publicId: publicId,
                name: r.display_name || fileName || 'Cloudinary Asset',
                bytes: r.bytes,
                format: r.format,
                createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
              });
            }
          }
          nextCursor = res.next_cursor;
        } catch (err) {
          console.warn(`[Cloudinary API] Error fetching ${resType} resources:`, err);
          break;
        }
      } while (nextCursor);
    }

    return assets;
  }

  // Returns all assets live from Cloudinary directly without stale caching
  static async getAll(forceLiveFetch = true): Promise<CloudinaryAsset[]> {
    // 1. Direct Live Cloudinary Fetch
    try {
      const liveAssets = await this.fetchFromCloudinaryApi();
      if (liveAssets && liveAssets.length > 0) {
        // Sync live assets list with local JSON & MySQL table so old deleted items are pruned
        await this.syncLiveAssets(liveAssets);
        return liveAssets;
      }
    } catch (err) {
      console.warn('[Cloudinary API] Live fetch error, falling back to storage:', err);
    }

    // 2. Fallback to JSON storage (clean real assets)
    const jsonAssets = await readJson<CloudinaryAsset[]>(ASSETS_FILE, []);
    if (jsonAssets && jsonAssets.length > 0) {
      return jsonAssets;
    }

    // 3. Fallback to MySQL if table exists
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM cloudinary_assets ORDER BY created_at DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            url: r.url,
            publicId: r.public_id || undefined,
            name: r.name || 'Untitled Image',
            bytes: r.bytes || undefined,
            format: r.format || undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
          }));
        }
      } catch (err: any) {
        if (err?.code !== 'ER_NO_SUCH_TABLE') {
          console.warn('[MySQL] Error querying cloudinary_assets table:', err?.message || err);
        }
      }
    }

    return [];
  }

  // Internal helper to keep storage exactly synchronized with Cloudinary cloud
  private static async syncLiveAssets(liveAssets: CloudinaryAsset[]): Promise<void> {
    try {
      const sanitizedAssets = liveAssets.map(a => ({
        ...a,
        url: addCloudinaryOriginalFlag(a.url)
      }));
      await writeJson(ASSETS_FILE, sanitizedAssets);
      const pool = getDbPool();
      if (pool) {
        // Replace table contents so stale items are replaced by real live assets
        await pool.query('DELETE FROM cloudinary_assets');
        for (const asset of sanitizedAssets) {
          await pool.query(
            `INSERT INTO cloudinary_assets (id, url, public_id, name, bytes, format, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              asset.id,
              asset.url,
              asset.publicId || null,
              asset.name,
              asset.bytes || null,
              asset.format || null,
              asset.createdAt ? new Date(asset.createdAt) : new Date()
            ]
          );
        }
      }
    } catch (err) {
      console.warn('[Cloudinary Sync] Error synchronizing live assets with storage:', err);
    }
  }

  // Save all assets to JSON and DB
  static async saveAll(assets: CloudinaryAsset[]): Promise<CloudinaryAsset[]> {
    const sanitizedAssets = assets.map(a => ({
      ...a,
      url: addCloudinaryOriginalFlag(a.url)
    }));
    await writeJson(ASSETS_FILE, sanitizedAssets);
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM cloudinary_assets');
        for (const asset of sanitizedAssets) {
          await pool.query(
            `INSERT INTO cloudinary_assets (id, url, public_id, name, bytes, format, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              asset.id,
              asset.url,
              asset.publicId || null,
              asset.name,
              asset.bytes || null,
              asset.format || null,
              asset.createdAt ? new Date(asset.createdAt) : new Date()
            ]
          );
        }
      } catch (err) {
        console.warn('[MySQL] Error saving assets to database:', err);
      }
    }
    return sanitizedAssets;
  }

  // Add a single asset
  static async addAsset(asset: Omit<CloudinaryAsset, 'id' | 'createdAt'>): Promise<CloudinaryAsset> {
    const formattedUrl = addCloudinaryOriginalFlag(asset.url);
    const newAsset: CloudinaryAsset = {
      ...asset,
      url: formattedUrl,
      id: `as_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Direct local JSON update
    try {
      const assets = await readJson<CloudinaryAsset[]>(ASSETS_FILE, []);
      assets.unshift(newAsset);
      await writeJson(ASSETS_FILE, assets);
    } catch (err) {
      console.warn('[CloudinaryAssetRepository] JSON write failed in addAsset:', err);
    }

    // 2. Direct single SQL insert
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO cloudinary_assets (id, url, public_id, name, bytes, format, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            newAsset.id,
            newAsset.url,
            newAsset.publicId || null,
            newAsset.name,
            newAsset.bytes || null,
            newAsset.format || null,
            newAsset.createdAt ? new Date(newAsset.createdAt) : new Date()
          ]
        );
      } catch (err) {
        console.warn('[CloudinaryAssetRepository] MySQL insert failed in addAsset:', err);
      }
    }

    return newAsset;
  }

  // Delete an asset from DB / JSON tracking
  static async deleteAsset(id: string): Promise<boolean> {
    return this.deleteAssets([id]);
  }

  // Delete multiple assets in bulk from DB / JSON tracking
  static async deleteAssets(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    const idSet = new Set(ids);
    const assets = await this.getAll(false);
    const filtered = assets.filter(a => !idSet.has(a.id));

    await writeJson(ASSETS_FILE, filtered);
    const pool = getDbPool();
    if (pool) {
      try {
        const placeholders = ids.map(() => '?').join(',');
        await pool.query(`DELETE FROM cloudinary_assets WHERE id IN (${placeholders})`, ids);
      } catch (err) {
        console.warn('[MySQL] Error deleting assets in bulk from database:', err);
      }
    }
    return true;
  }

  // Checks which products, categories, or site logo are using this URL or array of URLs
  static async getLinkedEntities(urls: string | string[]): Promise<{
    products: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    isSiteLogo: boolean;
  }> {
    const urlSet = new Set(Array.isArray(urls) ? urls : [urls]);
    const linkedProductsMap = new Map<string, string>();
    const linkedCategoriesMap = new Map<string, string>();
    let isSiteLogo = false;

    try {
      // 1. Check products
      const products = await ProductRepository.getAll(true);
      for (const p of products) {
        const matches = p.images?.some((img: any) => urlSet.has(img.url));
        if (matches) {
          linkedProductsMap.set(p.id, p.name);
        }
      }

      // 2. Check categories
      const categories = await CategoryRepository.getAll();
      for (const c of categories) {
        if (c.image && urlSet.has(c.image)) {
          linkedCategoriesMap.set(c.id, c.name);
        }
      }

      // 3. Check site logo
      const settings = await SettingsRepository.getSettings();
      if (settings && settings.appLogo && urlSet.has(settings.appLogo)) {
        isSiteLogo = true;
      }
    } catch (err) {
      console.warn('Error checking linked entities for asset(s):', err);
    }

    return {
      products: Array.from(linkedProductsMap.entries()).map(([id, name]) => ({ id, name })),
      categories: Array.from(linkedCategoriesMap.entries()).map(([id, name]) => ({ id, name })),
      isSiteLogo
    };
  }
}
