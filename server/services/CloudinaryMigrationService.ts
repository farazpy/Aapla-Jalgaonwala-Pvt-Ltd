import { readJson, writeJson, invalidateJsonCache } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { uploadToTeleCloud } from '../utils/telecloud';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';

export interface CloudinaryMigrationItem {
  id: string; // Unique key e.g. "products_p1_imageUrl"
  type: 'products' | 'categories' | 'settings' | 'woman_graphics' | 'gallery' | 'partners' | 'cloudinary_assets';
  typeLabel: string; // e.g. "Products Catalog", "Category Banner", "Store Settings & Branding"
  entityId: string; // ID of record
  entityTitle: string; // Display title e.g. "Diwali Special Box"
  fieldName: string; // Column or object key
  currentUrl: string; // The Cloudinary URL to download & replace
  status: 'pending' | 'migrating' | 'success' | 'failed';
  newUrl?: string;
  error?: string;
  sizeBytes?: number;
  migratedAt?: string;
}

export class CloudinaryMigrationService {
  /**
   * Scans all database tables and JSON storage files for any Cloudinary URLs.
   */
  public static async detectAllCloudinaryAssets(): Promise<CloudinaryMigrationItem[]> {
    const itemsMap = new Map<string, CloudinaryMigrationItem>();

    const isCloudinaryUrl = (url: any): boolean => {
      if (!url || typeof url !== 'string') return false;
      const lower = url.toLowerCase();
      return lower.includes('res.cloudinary.com') || lower.includes('cloudinary');
    };

    // 1. Scan Products (products.json & MySQL)
    try {
      const products = await readJson<any[]>('products.json', []);
      for (const p of products) {
        if (isCloudinaryUrl(p.imageUrl)) {
          const key = `products_${p.id}_imageUrl`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'products',
              typeLabel: 'Products Catalog',
              entityId: String(p.id),
              entityTitle: p.name || `Product #${p.id}`,
              fieldName: 'imageUrl',
              currentUrl: p.imageUrl,
              status: 'pending'
            });
          }
        }
        if (isCloudinaryUrl(p.hoverImageUrl)) {
          const key = `products_${p.id}_hoverImageUrl`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'products',
              typeLabel: 'Products Catalog',
              entityId: String(p.id),
              entityTitle: p.name || `Product #${p.id}`,
              fieldName: 'hoverImageUrl',
              currentUrl: p.hoverImageUrl,
              status: 'pending'
            });
          }
        }
        if (Array.isArray(p.images)) {
          p.images.forEach((imgObj: any, idx: number) => {
            const url = typeof imgObj === 'string' ? imgObj : imgObj?.url;
            if (isCloudinaryUrl(url)) {
              const key = `products_${p.id}_images_${idx}`;
              if (!itemsMap.has(key)) {
                itemsMap.set(key, {
                  id: key,
                  type: 'products',
                  typeLabel: 'Product Image Gallery',
                  entityId: String(p.id),
                  entityTitle: `${p.name || 'Product'} (Gallery #${idx + 1})`,
                  fieldName: `images[${idx}].url`,
                  currentUrl: url,
                  status: 'pending'
                });
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning products.json:', err);
    }

    // 2. Scan Categories (categories.json & MySQL)
    try {
      const categories = await readJson<any[]>('categories.json', []);
      for (const c of categories) {
        if (isCloudinaryUrl(c.image)) {
          const key = `categories_${c.id}_image`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'categories',
              typeLabel: 'Categories Catalog',
              entityId: String(c.id),
              entityTitle: c.name || `Category #${c.id}`,
              fieldName: 'image',
              currentUrl: c.image,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning categories.json:', err);
    }

    // 3. Scan Settings & Branding (settings.json)
    try {
      const settings = await readJson<any>('settings.json', {});
      const settingsFields = [
        { key: 'appLogo', label: 'Header & App Logo' },
        { key: 'ourStoryHeroImageUrl', label: 'Our Story Page Hero Image' },
        { key: 'heroCardImage', label: 'Homepage Hero Showcase Image' },
        { key: 'faviconIcoUrl', label: 'Favicon ICO Asset' },
        { key: 'faviconPngUrl', label: 'Favicon PNG Asset' },
        { key: 'faviconSvgUrl', label: 'Favicon SVG Vector' },
        { key: 'appleTouchIconUrl', label: 'Apple Touch Icon' },
        { key: 'siteWebmanifestUrl', label: 'PWA Web Manifest' },
        { key: 'defaultUserAvatar', label: 'Default Customer Profile Avatar' },
        { key: 'heroSecondaryCtaImage', label: 'Homepage Hero Secondary CTA' }
      ];

      for (const f of settingsFields) {
        const val = settings[f.key];
        if (isCloudinaryUrl(val)) {
          const key = `settings_${f.key}`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'settings',
              typeLabel: 'Store Settings & Branding',
              entityId: 'general_settings',
              entityTitle: f.label,
              fieldName: f.key,
              currentUrl: val,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning settings.json:', err);
    }

    // 4. Scan Woman Graphics (woman_graphics.json)
    try {
      const womanGraphics = await readJson<any[]>('woman_graphics.json', []);
      for (const wg of womanGraphics) {
        const imgUrl = wg.image_url || wg.imageUrl;
        if (isCloudinaryUrl(imgUrl)) {
          const key = `woman_graphics_${wg.id}_image_url`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'woman_graphics',
              typeLabel: 'Woman Partner Graphics',
              entityId: String(wg.id),
              entityTitle: wg.title || `Graphics Post #${wg.id}`,
              fieldName: 'image_url',
              currentUrl: imgUrl,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning woman_graphics.json:', err);
    }

    // 5. Scan Gallery Media (gallery.json)
    try {
      const gallery = await readJson<any[]>('gallery.json', []);
      for (const g of gallery) {
        const url = g.imgUrl || g.img_url || g.imageUrl || g.url;
        if (isCloudinaryUrl(url)) {
          const key = `gallery_${g.id}_url`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'gallery',
              typeLabel: 'Store Gallery Media',
              entityId: String(g.id),
              entityTitle: g.title || `Gallery Item #${g.id}`,
              fieldName: 'imgUrl',
              currentUrl: url,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning gallery.json:', err);
    }

    // 6. Scan Business Partner Documents (business_partners.json)
    try {
      const partners = await readJson<any[]>('business_partners.json', []);
      for (const p of partners) {
        if (isCloudinaryUrl(p.documentUrl || p.document_url)) {
          const docUrl = p.documentUrl || p.document_url;
          const key = `partners_${p.id}_documentUrl`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'partners',
              typeLabel: 'Woman Partner Passbooks',
              entityId: String(p.id),
              entityTitle: p.fullName || p.full_name || `Partner #${p.partnerCode || p.id}`,
              fieldName: 'documentUrl',
              currentUrl: docUrl,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning business_partners.json:', err);
    }

    // 7. Scan Cloudinary Assets Library (cloudinary_assets.json)
    try {
      const assets = await readJson<any[]>('cloudinary_assets.json', []);
      for (const a of assets) {
        if (isCloudinaryUrl(a.url)) {
          const key = `cloudinary_assets_${a.id}_url`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'cloudinary_assets',
              typeLabel: 'Media Library Asset',
              entityId: String(a.id),
              entityTitle: a.name || `Media File #${a.id}`,
              fieldName: 'url',
              currentUrl: a.url,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning cloudinary_assets.json:', err);
    }

    // 8. Scan Owners & Founders Photos (owners.json)
    try {
      const owners = await readJson<any[]>('owners.json', []);
      for (const o of owners) {
        const photo = o.photoUrl || o.photo_url;
        if (isCloudinaryUrl(photo)) {
          const key = `owners_${o.id}_photoUrl`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              id: key,
              type: 'settings' as any,
              typeLabel: 'Owners & Founders Profile',
              entityId: String(o.id),
              entityTitle: o.name || `Owner #${o.id}`,
              fieldName: 'photoUrl',
              currentUrl: photo,
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MigrationScanner] Error scanning owners.json:', err);
    }

    // Also scan MySQL DB tables if DB pool exists
    const pool = getDbPool();
    if (pool) {
      try {
        // Products
        const [prodRows]: any = await pool.query(`SELECT * FROM products LIMIT 500`);
        if (Array.isArray(prodRows)) {
          for (const r of prodRows) {
            const imgUrl = r.image_url || r.imageUrl || r.image;
            const hoverUrl = r.hover_image_url || r.hoverImageUrl;
            if (isCloudinaryUrl(imgUrl)) {
              const key = `products_${r.id}_imageUrl`;
              if (!itemsMap.has(key)) {
                itemsMap.set(key, {
                  id: key,
                  type: 'products',
                  typeLabel: 'Products Catalog (MySQL)',
                  entityId: String(r.id),
                  entityTitle: r.name || `Product #${r.id}`,
                  fieldName: 'image_url',
                  currentUrl: imgUrl,
                  status: 'pending'
                });
              }
            }
            if (isCloudinaryUrl(hoverUrl)) {
              const key = `products_${r.id}_hoverImageUrl`;
              if (!itemsMap.has(key)) {
                itemsMap.set(key, {
                  id: key,
                  type: 'products',
                  typeLabel: 'Products Catalog (MySQL)',
                  entityId: String(r.id),
                  entityTitle: r.name || `Product #${r.id}`,
                  fieldName: 'hover_image_url',
                  currentUrl: hoverUrl,
                  status: 'pending'
                });
              }
            }
          }
        }

        // Product Images
        const [piRows]: any = await pool.query(
          `SELECT id, product_id, url FROM product_images WHERE url LIKE '%cloudinary%'`
        );
        if (Array.isArray(piRows)) {
          for (const r of piRows) {
            const key = `product_images_${r.id}_url`;
            if (!itemsMap.has(key)) {
              itemsMap.set(key, {
                id: key,
                type: 'products',
                typeLabel: 'Product Image Gallery (MySQL)',
                entityId: String(r.product_id),
                entityTitle: `Product Image #${r.id}`,
                fieldName: 'url',
                currentUrl: r.url,
                status: 'pending'
              });
            }
          }
        }

        // Categories
        const [catRows]: any = await pool.query(
          `SELECT id, name, image FROM categories WHERE image LIKE '%cloudinary%'`
        );
        if (Array.isArray(catRows)) {
          for (const r of catRows) {
            const key = `categories_${r.id}_image`;
            if (!itemsMap.has(key)) {
              itemsMap.set(key, {
                id: key,
                type: 'categories',
                typeLabel: 'Categories Catalog (MySQL)',
                entityId: String(r.id),
                entityTitle: r.name || `Category #${r.id}`,
                fieldName: 'image',
                currentUrl: r.image,
                status: 'pending'
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn('[MigrationScanner] MySQL scanning notice:', dbErr);
      }
    }

    return Array.from(itemsMap.values());
  }

  /**
   * Temporary downloads a single Cloudinary file, uploads it to HTK TeleCloud S3,
   * retrieves direct CDN link, and updates DB + JSON repositories.
   */
  public static async migrateSingleAsset(item: CloudinaryMigrationItem): Promise<CloudinaryMigrationItem> {
    item.status = 'migrating';

    try {
      if (!item.currentUrl || !item.currentUrl.startsWith('http')) {
        throw new Error('Invalid Cloudinary URL');
      }

      // 1. Fetch / download raw buffer from Cloudinary URL
      const fetchRes = await fetch(item.currentUrl, {
        headers: { 'User-Agent': 'AaplaJalgaonwala-S3Migrator/1.0' }
      });

      if (!fetchRes.ok) {
        throw new Error(`Failed to download asset from Cloudinary (HTTP ${fetchRes.status}: ${fetchRes.statusText})`);
      }

      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!buffer || buffer.length === 0) {
        throw new Error('Downloaded file payload from Cloudinary is empty (0 bytes).');
      }

      // 2. Extract clean filename
      let fileName = 'migrated_asset.png';
      try {
        const urlParts = item.currentUrl.split('?')[0].split('/');
        const rawFileName = urlParts[urlParts.length - 1];
        if (rawFileName && rawFileName.includes('.')) {
          fileName = decodeURIComponent(rawFileName);
        } else {
          fileName = `${item.type}_${item.entityId}_${Date.now()}.png`;
        }
      } catch {
        fileName = `asset_${Date.now()}.png`;
      }

      // 3. Upload to TeleCloud S3 Remote Storage Engine
      const uploadCaption = `Migrated from Cloudinary (${item.typeLabel}: ${item.entityTitle})`;
      const tResult = await uploadToTeleCloud(buffer, fileName, {
        caption: uploadCaption,
        fileName
      });

      const newS3Url = tResult.url || tResult.directLink || tResult.fileUrl;
      if (!newS3Url) {
        throw new Error('TeleCloud Storage upload did not return a valid public S3 CDN URL.');
      }

      // 4. Update Persistence (JSON files + MySQL)
      await this.updateReferenceInDatabaseAndJson(item.currentUrl, newS3Url, item);

      item.status = 'success';
      item.newUrl = newS3Url;
      item.sizeBytes = tResult.size || buffer.length;
      item.migratedAt = new Date().toISOString();
      return item;
    } catch (err: any) {
      item.status = 'failed';
      item.error = err.message || 'Migration failed during upload or database update.';
      return item;
    }
  }

  /**
   * Replaces old Cloudinary URL with new TeleCloud S3 URL across all database tables & JSON storage files.
   */
  private static async updateReferenceInDatabaseAndJson(oldUrl: string, newUrl: string, item: CloudinaryMigrationItem): Promise<void> {
    const pool = getDbPool();

    // A. Update Products
    try {
      const products = await readJson<any[]>('products.json', []);
      let updatedProd = false;
      for (const p of products) {
        if (p.imageUrl === oldUrl) { p.imageUrl = newUrl; updatedProd = true; }
        if (p.hoverImageUrl === oldUrl) { p.hoverImageUrl = newUrl; updatedProd = true; }
        if (Array.isArray(p.images)) {
          p.images.forEach((imgObj: any) => {
            if (typeof imgObj === 'string' && imgObj === oldUrl) {
              imgObj = newUrl;
              updatedProd = true;
            } else if (imgObj && imgObj.url === oldUrl) {
              imgObj.url = newUrl;
              updatedProd = true;
            }
          });
        }
      }
      if (updatedProd) {
        await writeJson('products.json', products);
        ProductRepository.clearCache();
      }

      if (pool) {
        await pool.query('UPDATE products SET image_url = ? WHERE image_url = ?', [newUrl, oldUrl]).catch(() => {});
        await pool.query('UPDATE products SET hover_image_url = ? WHERE hover_image_url = ?', [newUrl, oldUrl]).catch(() => {});
        await pool.query('UPDATE product_images SET url = ? WHERE url = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating products reference:', err);
    }

    // B. Update Categories
    try {
      const categories = await readJson<any[]>('categories.json', []);
      let updatedCat = false;
      for (const c of categories) {
        if (c.image === oldUrl) {
          c.image = newUrl;
          updatedCat = true;
        }
      }
      if (updatedCat) {
        await writeJson('categories.json', categories);
        CategoryRepository.clearCache();
      }

      if (pool) {
        await pool.query('UPDATE categories SET image = ? WHERE image = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating categories reference:', err);
    }

    // C. Update Settings
    try {
      const settings = await readJson<any>('settings.json', {});
      let updatedSettings = false;
      for (const [k, v] of Object.entries(settings)) {
        if (typeof v === 'string' && v === oldUrl) {
          settings[k] = newUrl;
          updatedSettings = true;
        }
      }
      if (updatedSettings) {
        await SettingsRepository.updateSettings(settings);
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating settings reference:', err);
    }

    // D. Update Woman Graphics
    try {
      const wgList = await readJson<any[]>('woman_graphics.json', []);
      let updatedWg = false;
      for (const wg of wgList) {
        if (wg.image_url === oldUrl || wg.imageUrl === oldUrl) {
          wg.image_url = newUrl;
          wg.imageUrl = newUrl;
          updatedWg = true;
        }
      }
      if (updatedWg) {
        await writeJson('woman_graphics.json', wgList);
      }

      if (pool) {
        await pool.query('UPDATE woman_graphics SET image_url = ? WHERE image_url = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating woman_graphics reference:', err);
    }

    // E. Update Gallery Media
    try {
      const gallery = await readJson<any[]>('gallery.json', []);
      let updatedGal = false;
      for (const g of gallery) {
        if (g.url === oldUrl || g.imgUrl === oldUrl || g.img_url === oldUrl || g.imageUrl === oldUrl) {
          g.url = newUrl;
          g.imgUrl = newUrl;
          g.img_url = newUrl;
          g.imageUrl = newUrl;
          updatedGal = true;
        }
      }
      if (updatedGal) {
        await writeJson('gallery.json', gallery);
      }

      if (pool) {
        await pool.query('UPDATE gallery_media SET img_url = ? WHERE img_url = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating gallery reference:', err);
    }

    // F. Update Business Partners Passbooks
    try {
      const partners = await readJson<any[]>('business_partners.json', []);
      let updatedPart = false;
      for (const p of partners) {
        if (p.documentUrl === oldUrl || p.document_url === oldUrl) {
          p.documentUrl = newUrl;
          p.document_url = newUrl;
          updatedPart = true;
        }
      }
      if (updatedPart) {
        await writeJson('business_partners.json', partners);
      }

      if (pool) {
        await pool.query('UPDATE business_partners SET document_url = ? WHERE document_url = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating business_partners reference:', err);
    }

    // G. Update Cloudinary Assets Library
    try {
      const assets = await readJson<any[]>('cloudinary_assets.json', []);
      let updatedAsset = false;
      for (const a of assets) {
        if (a.url === oldUrl) {
          a.url = newUrl;
          updatedAsset = true;
        }
      }
      if (updatedAsset) {
        await writeJson('cloudinary_assets.json', assets);
      }

      if (pool) {
        await pool.query('UPDATE cloudinary_assets SET url = ? WHERE url = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating cloudinary_assets reference:', err);
    }

    // H. Update Owners Photos
    try {
      const owners = await readJson<any[]>('owners.json', []);
      let updatedOwner = false;
      for (const o of owners) {
        if (o.photoUrl === oldUrl || o.photo_url === oldUrl) {
          o.photoUrl = newUrl;
          o.photo_url = newUrl;
          updatedOwner = true;
        }
      }
      if (updatedOwner) {
        await writeJson('owners.json', owners);
      }

      if (pool) {
        await pool.query('UPDATE owners SET photo_url = ? WHERE photo_url = ?', [newUrl, oldUrl]).catch(() => {});
      }
    } catch (err) {
      console.warn('[MigrationRef] Error updating owners reference:', err);
    }

    // Invalidate JSON cache
    invalidateJsonCache();
  }
}
