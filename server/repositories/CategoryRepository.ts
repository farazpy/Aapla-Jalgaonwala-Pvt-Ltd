import { Category } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { initialCategories } from '@/data/categories';
import { addCloudinaryOriginalFlag } from '../utils/cloudinary';

const FILE_NAME = 'categories.json';
const SEED_MARKER = '.categories_initialized.json';

let cachedCategories: { data: Category[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 60s memory cache with instant invalidation

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export class CategoryRepository {
  static clearCache() {
    cachedCategories = null;
  }

  static async getAll(): Promise<Category[]> {
    if (cachedCategories && (Date.now() - cachedCategories.timestamp < CACHE_TTL_MS)) {
      return cachedCategories.data;
    }

    const isInitializedMarker = await readJson<{ initialized: boolean } | null>(SEED_MARKER, null);
    const pool = getDbPool();
    let categories: Category[] = [];

    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        if (Array.isArray(rows)) {
          if (rows.length === 0 && !isInitializedMarker) {
            // Auto-seed initial categories into MySQL ONCE
            for (const cat of initialCategories) {
              await pool.query(
                `INSERT INTO categories (id, slug, name, tagline, description, image, product_count)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE name=VALUES(name), tagline=VALUES(tagline), description=VALUES(description), image=VALUES(image)`,
                [cat.id, cat.slug, cat.name, cat.tagline || cat.description, cat.description, cat.image || '', cat.productCount || 0]
              ).catch(() => {});
            }
            await writeJson(SEED_MARKER, { initialized: true });
            cachedCategories = { data: initialCategories, timestamp: Date.now() };
            return initialCategories;
          }

          // Check if any initial category is missing, if so insert it dynamically to keep DB in sync
          const existingSlugs = new Set((rows as any[]).map(r => String(r.slug || '').toLowerCase()));
          for (const cat of initialCategories) {
            if (!existingSlugs.has(cat.slug.toLowerCase())) {
              try {
                await pool.query(
                  `INSERT INTO categories (id, slug, name, tagline, description, image, product_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [cat.id, cat.slug, cat.name, cat.tagline || cat.description, cat.description, cat.image || '', cat.productCount || 0]
                );
                rows.push({
                  id: cat.id,
                  slug: cat.slug,
                  name: cat.name,
                  tagline: cat.tagline || cat.description,
                  description: cat.description,
                  image: cat.image || '',
                  product_count: cat.productCount || 0
                });
                console.log(`[CategoryRepo] Auto-seeded missing category: ${cat.slug}`);
              } catch (err: any) {
                console.warn(`[CategoryRepo] Failed to auto-seed missing category ${cat.slug}:`, err?.message || err);
              }
            }
          }

          if (rows.length === 0 && isInitializedMarker) {
            return [];
          }

          // Get product counts for each category in 1 fast query
          const [counts]: any = await pool.query(
            'SELECT category_id, COUNT(*) as count FROM products WHERE is_available = TRUE GROUP BY category_id'
          ).catch(() => [[]]);

          const countMap = new Map<string, number>();
          if (Array.isArray(counts)) {
            counts.forEach((c: any) => {
              if (c.category_id) {
                countMap.set(String(c.category_id), Number(c.count) || 0);
              }
            });
          }

          categories = (rows as any[]).map(r => {
            const countFromId = countMap.get(String(r.id)) || 0;
            const countFromSlug = countMap.get(String(r.slug)) || 0;
            const totalCount = countFromId + (r.id !== r.slug ? countFromSlug : 0);
            const cleanName = String(r.name || '').replace(/Banana Chipss/gi, 'Banana Chips');
            return {
              id: String(r.id),
              slug: r.slug,
              name: cleanName,
              tagline: r.tagline || r.description || '',
              description: r.description || '',
              image: r.image || '',
              productCount: totalCount || r.product_count || 0
            };
          });

          cachedCategories = { data: categories, timestamp: Date.now() };
          return categories;
        }
      } catch (err) {
        console.warn('[CategoryRepo] MySQL query failed, fallback to local JSON:', err);
      }
    }

    const jsonCategories = await readJson<Category[]>(FILE_NAME, []);
    if ((!jsonCategories || jsonCategories.length === 0) && !isInitializedMarker) {
      await writeJson(FILE_NAME, initialCategories);
      await writeJson(SEED_MARKER, { initialized: true });
      cachedCategories = { data: initialCategories, timestamp: Date.now() };
      return initialCategories;
    }
    
    categories = jsonCategories && jsonCategories.length > 0 ? jsonCategories : initialCategories;
    cachedCategories = { data: categories, timestamp: Date.now() };
    return categories;
  }

  static async getBySlug(slugOrId: string): Promise<Category | null> {
    const categories = await this.getAll();
    return categories.find(c => c.slug === slugOrId || c.id === slugOrId) || null;
  }

  static async create(data: { name: string; slug?: string; tagline?: string; description?: string; image?: string }): Promise<Category> {
    this.clearCache();
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const id = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCategory: Category = {
      id,
      slug,
      name: data.name.trim(),
      tagline: data.tagline?.trim() || data.description || '',
      description: data.description || '',
      image: addCloudinaryOriginalFlag(data.image || ''),
      productCount: 0
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO categories (id, slug, name, tagline, description, image, product_count)
           VALUES (?, ?, ?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE
           name = VALUES(name), tagline = VALUES(tagline), description = VALUES(description), image = VALUES(image), updated_at = NOW()`,
          [id, slug, newCategory.name, newCategory.tagline, newCategory.description, newCategory.image]
        );
      } catch (err) {
        console.warn('[CategoryRepo] MySQL insert failed:', err);
      }
    }

    const categories = await readJson<Category[]>(FILE_NAME, initialCategories);
    const existingIdx = categories.findIndex(c => c.slug === slug);
    if (existingIdx >= 0) {
      categories[existingIdx] = newCategory;
    } else {
      categories.push(newCategory);
    }
    await writeJson(FILE_NAME, categories);

    return newCategory;
  }

  static async update(idOrSlug: string, data: Partial<Category>): Promise<Category | null> {
    this.clearCache();
    const existing = await this.getBySlug(idOrSlug);
    if (!existing) return null;

    const updatedSlug = data.slug ? slugify(data.slug) : existing.slug;
    const updatedCategory: Category = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      slug: updatedSlug,
      tagline: data.tagline !== undefined ? data.tagline : (existing.tagline || existing.description),
      description: data.description !== undefined ? data.description : existing.description,
      image: data.image !== undefined ? addCloudinaryOriginalFlag(data.image) : existing.image
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE categories 
           SET name = ?, slug = ?, tagline = ?, description = ?, image = ?, updated_at = NOW() 
           WHERE id = ? OR slug = ?`,
          [updatedCategory.name, updatedCategory.slug, updatedCategory.tagline, updatedCategory.description, updatedCategory.image, existing.id, existing.slug]
        );

        if (existing.slug !== updatedCategory.slug) {
          await pool.query('UPDATE products SET category_id = ? WHERE category_id = ? OR category_id = ?', [updatedCategory.id, existing.id, existing.slug]).catch(() => {});
        }
      } catch (err) {
        console.warn('[CategoryRepo] MySQL update failed:', err);
      }
    }

    const categories = await readJson<Category[]>(FILE_NAME, initialCategories);
    const idx = categories.findIndex(c => c.id === existing.id || c.slug === existing.slug);
    if (idx >= 0) {
      categories[idx] = updatedCategory;
      await writeJson(FILE_NAME, categories);
    }

    return updatedCategory;
  }

  static async delete(idOrSlug: string): Promise<boolean> {
    this.clearCache();
    const existing = await this.getBySlug(idOrSlug);
    if (!existing) return false;

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM categories WHERE id = ? OR slug = ?', [existing.id, existing.slug]);
      } catch (err) {
        console.warn('[CategoryRepo] MySQL delete failed:', err);
      }
    }

    const categories = await readJson<Category[]>(FILE_NAME, initialCategories);
    const filtered = categories.filter(c => c.id !== existing.id && c.slug !== existing.slug);
    await writeJson(FILE_NAME, filtered);

    return true;
  }

  static async updateImage(idOrSlug: string, imageUrl: string): Promise<boolean> {
    const res = await this.update(idOrSlug, { image: imageUrl });
    return !!res;
  }
}
