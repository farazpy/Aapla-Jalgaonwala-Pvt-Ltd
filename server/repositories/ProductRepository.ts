import { Product, ProductVariant, Category } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { CategoryRepository } from './CategoryRepository';
import { initialProducts } from '@/data/products';
import { addCloudinaryOriginalFlag } from '../utils/cloudinary';

const FILE_NAME = 'products.json';
const SEED_MARKER = '.products_initialized.json';

let productMemoryCache: { data: Product[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 60 seconds fast read cache (instant cache invalidation on any write)

export class ProductRepository {
  public static clearCache() {
    productMemoryCache = null;
  }

  private static async resolveCategoryInfo(rawCategory?: string, rawCategoryId?: string): Promise<{ id: string; slug: string; name: string }> {
    try {
      const categories = await CategoryRepository.getAll();

      // If rawCategory (slug, name, or id) is passed, search by slug/name/id first
      if (rawCategory) {
        const match = categories.find(
          c => c.slug === String(rawCategory) || c.id === String(rawCategory) || c.name.toLowerCase() === String(rawCategory).toLowerCase()
        );
        if (match) {
          return { id: String(match.id), slug: match.slug, name: match.name };
        }
      }

      // If rawCategoryId is passed
      if (rawCategoryId) {
        const match = categories.find(
          c => c.id === String(rawCategoryId) || c.slug === String(rawCategoryId) || c.name.toLowerCase() === String(rawCategoryId).toLowerCase()
        );
        if (match) {
          return { id: String(match.id), slug: match.slug, name: match.name };
        }
      }
    } catch {
      // Fallback
    }

    const fallbackSlug = rawCategory || rawCategoryId || 'banana-chips';
    return {
      id: rawCategoryId || rawCategory || '1',
      slug: fallbackSlug,
      name: fallbackSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  }

  private static mapSingleRowToProduct(row: any, imageMap: Map<string, any[]>, variantMap?: Map<string, ProductVariant[]>): Product {
    let images: any[] = imageMap.get(String(row.id)) || [];

    if (images.length === 0 && row.images) {
      try {
        images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
      } catch {
        images = [];
      }
    }

    if (!images || !Array.isArray(images)) {
      images = [];
    }

    let variants: ProductVariant[] = variantMap?.get(String(row.id)) || [];
    if (variants.length === 0 && row.variants) {
      try {
        variants = typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants;
      } catch {
        variants = [];
      }
    }
    if (!Array.isArray(variants)) {
      variants = [];
    }

    let tags = [];
    if (row.tags) {
      try {
        tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
      } catch {
        tags = [];
      }
    }

    let ingredients = [];
    if (row.ingredients) {
      try {
        ingredients = typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : row.ingredients;
      } catch {
        ingredients = [];
      }
    }

    let comboImages: Record<string, string> | undefined = undefined;
    if (row.combo_images) {
      try {
        comboImages = typeof row.combo_images === 'string' ? JSON.parse(row.combo_images) : row.combo_images;
      } catch {
        comboImages = undefined;
      }
    } else if (row.comboImages) {
      comboImages = typeof row.comboImages === 'string' ? JSON.parse(row.comboImages) : row.comboImages;
    }

    // Resolve category attributes using joined data or fallback resolution
    const categorySlug = row.cat_slug || (row.category && isNaN(Number(row.category)) ? row.category : null) || row.category_id || 'banana-chips';
    const categoryId = row.cat_id ? String(row.cat_id) : (row.category_id ? String(row.category_id) : undefined);
    const categoryName = row.cat_name || row.categoryName || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    return {
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      category: categorySlug,
      categoryId: categoryId,
      categoryName: categoryName,
      description: row.description || '',
      shortDescription: row.short_description || row.shortDescription || '',
      price: Number(row.price),
      mrp: Number(row.mrp || row.price),
      profit: row.profit !== undefined && row.profit !== null ? Number(row.profit) : 0,
      discount: row.discount ? Number(row.discount) : undefined,
      netQuantity: row.net_quantity || row.netQuantity || '100g',
      flavour: row.flavour || undefined,
      tags: Array.isArray(tags) ? tags : [],
      isFeatured: Boolean(row.is_featured ?? row.isFeatured),
      isBestSeller: Boolean(row.is_best_seller ?? row.isBestSeller),
      isNew: Boolean(row.is_new ?? row.isNew),
      isAvailable: Boolean(row.is_available ?? row.isAvailable ?? true),
      stock: Number(row.stock || 100),
      images,
      variants: variants.length > 0 ? variants : undefined,
      ingredients,
      seoTitle: row.seo_title || row.seoTitle,
      seoDescription: row.seo_description || row.seoDescription,
      comboImages
    };
  }

  private static async mapRowToProduct(row: any, pool?: any): Promise<Product> {
    const imageMap = new Map<string, any[]>();
    const variantMap = new Map<string, ProductVariant[]>();

    if (pool && row.id) {
      try {
        const [imgRows]: any = await pool.query(
          'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC',
          [row.id]
        );
        if (Array.isArray(imgRows) && imgRows.length > 0) {
          imageMap.set(String(row.id), imgRows.map((img: any) => ({
            id: img.id,
            url: img.url,
            alt: img.alt || '',
            isPrimary: Boolean(img.is_primary)
          })));
        }
      } catch (_) {}

      try {
        const [varRows]: any = await pool.query(
          'SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC',
          [row.id]
        );
        if (Array.isArray(varRows) && varRows.length > 0) {
          variantMap.set(String(row.id), varRows.map((v: any) => ({
            id: String(v.id),
            weight: String(v.weight),
            price: Number(v.price),
            mrp: Number(v.mrp || v.price),
            stock: Number(v.stock ?? 100)
          })));
        }
      } catch (_) {}
    }

    return this.mapSingleRowToProduct(row, imageMap, variantMap);
  }

  static async getAll(includeUnavailable = false): Promise<Product[]> {
    if (productMemoryCache && (Date.now() - productMemoryCache.timestamp < CACHE_TTL_MS)) {
      return includeUnavailable
        ? productMemoryCache.data
        : productMemoryCache.data.filter(p => p.isAvailable);
    }

    let fetchedProducts: Product[] = [];
    const pool = getDbPool();
    if (pool) {
      try {
        const query = `
          SELECT p.*, c.id AS cat_id, c.slug AS cat_slug, c.name AS cat_name
          FROM products p
          LEFT JOIN categories c ON (p.category_id = c.id OR p.category_id = c.slug)
          ORDER BY p.created_at DESC
        `;
        const [rows]: any = await pool.query(query);
        if (Array.isArray(rows) && rows.length > 0) {
          const productIds = rows.map((r: any) => r.id);
          const imageMap = new Map<string, any[]>();
          const variantMap = new Map<string, ProductVariant[]>();

          // Batch fetch ALL images in a single SQL query
          if (productIds.length > 0) {
            try {
              const [imgRows]: any = await pool.query(
                'SELECT * FROM product_images WHERE product_id IN (?) ORDER BY is_primary DESC, id ASC',
                [productIds]
              );
              if (Array.isArray(imgRows)) {
                for (const img of imgRows) {
                  const pid = String(img.product_id);
                  if (!imageMap.has(pid)) {
                    imageMap.set(pid, []);
                  }
                  imageMap.get(pid)!.push({
                    id: img.id,
                    url: img.url,
                    alt: img.alt || '',
                    isPrimary: Boolean(img.is_primary)
                  });
                }
              }
            } catch (_) {}

            // Batch fetch ALL product variants in a single SQL query
            try {
              const [varRows]: any = await pool.query(
                'SELECT * FROM product_variants WHERE product_id IN (?) ORDER BY price ASC',
                [productIds]
              );
              if (Array.isArray(varRows)) {
                for (const v of varRows) {
                  const pid = String(v.product_id);
                  if (!variantMap.has(pid)) {
                    variantMap.set(pid, []);
                  }
                  variantMap.get(pid)!.push({
                    id: String(v.id),
                    weight: String(v.weight),
                    price: Number(v.price),
                    mrp: Number(v.mrp || v.price),
                    stock: Number(v.stock ?? 100)
                  });
                }
              }
            } catch (_) {}
          }

          fetchedProducts = rows.map((r: any) => this.mapSingleRowToProduct(r, imageMap, variantMap));
        }
      } catch (err: any) {
        try {
          const [simpleRows]: any = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
          if (Array.isArray(simpleRows) && simpleRows.length > 0) {
            const productIds = simpleRows.map((r: any) => r.id);
            const imageMap = new Map<string, any[]>();
            const variantMap = new Map<string, ProductVariant[]>();
            try {
              const [imgRows]: any = await pool.query(
                'SELECT * FROM product_images WHERE product_id IN (?) ORDER BY is_primary DESC',
                [productIds]
              );
              if (Array.isArray(imgRows)) {
                for (const img of imgRows) {
                  const pid = String(img.product_id);
                  if (!imageMap.has(pid)) imageMap.set(pid, []);
                  imageMap.get(pid)!.push({ id: img.id, url: img.url, alt: img.alt || '', isPrimary: Boolean(img.is_primary) });
                }
              }
            } catch (_) {}

            try {
              const [varRows]: any = await pool.query(
                'SELECT * FROM product_variants WHERE product_id IN (?) ORDER BY price ASC',
                [productIds]
              );
              if (Array.isArray(varRows)) {
                for (const v of varRows) {
                  const pid = String(v.product_id);
                  if (!variantMap.has(pid)) variantMap.set(pid, []);
                  variantMap.get(pid)!.push({
                    id: String(v.id),
                    weight: String(v.weight),
                    price: Number(v.price),
                    mrp: Number(v.mrp || v.price),
                    stock: Number(v.stock ?? 100)
                  });
                }
              }
            } catch (_) {}

            fetchedProducts = simpleRows.map((r: any) => this.mapSingleRowToProduct(r, imageMap, variantMap));
          }
        } catch {
          // Fallback to JSON
        }
      }
    }

    if (fetchedProducts.length === 0) {
      fetchedProducts = await readJson<Product[]>(FILE_NAME, initialProducts);
    }

    const products = fetchedProducts.length > 0 ? fetchedProducts : initialProducts;

    productMemoryCache = { data: products, timestamp: Date.now() };
    return includeUnavailable ? products : products.filter(p => p.isAvailable);
  }

  static async getBySlug(slug: string): Promise<Product | null> {
    const products = await this.getAll(true);
    return products.find(p => p.slug === slug || p.id === slug) || null;
  }

  static async getByCategory(categorySlug: string): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => p.category === categorySlug || p.categoryId === categorySlug);
  }

  static async getFeatured(): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => p.isFeatured);
  }

  static async search(query: string): Promise<Product[]> {
    const products = await this.getAll();
    if (!query || !query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
      (p.flavour && p.flavour.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
      p.description.toLowerCase().includes(q) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
    );
  }

  static async getRecommendations(productId: string, limit = 4): Promise<Product[]> {
    const all = await this.getAll();
    const target = all.find(p => p.id === productId || p.slug === productId);
    if (!target) return all.slice(0, limit);

    // Filter out target product
    const others = all.filter(p => p.id !== target.id);

    // Score by same category and matching tags/flavour
    const scored = others.map(p => {
      let score = 0;
      if (p.category === target.category || (p.categoryId && p.categoryId === target.categoryId)) score += 5;
      if (p.flavour && target.flavour && p.flavour.toLowerCase() === target.flavour.toLowerCase()) score += 3;
      if (p.tags && target.tags) {
        const matchingTags = p.tags.filter(t => target.tags?.includes(t));
        score += matchingTags.length * 2;
      }
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.product);
  }

  static async getById(id: string): Promise<Product | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query(
          `SELECT p.*, c.id AS cat_id, c.slug AS cat_slug, c.name AS cat_name
           FROM products p
           LEFT JOIN categories c ON (p.category_id = c.id OR p.category_id = c.slug)
           WHERE p.id = ?`,
          [id]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return await this.mapRowToProduct((rows as any[])[0], pool);
        }
      } catch (err) {
        console.warn('[ProductRepo] MySQL getById failed, using fallback:', err);
      }
    }
    const products = await this.getAll(true);
    return products.find(p => p.id === id) || null;
  }

  static async create(data: Partial<Product>): Promise<Product> {
    this.clearCache();
    const id = data.id || `prod-${Date.now()}`;
    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `product-${Date.now()}`);
    let price = Number(data.price || 0);
    let mrp = Number(data.mrp || price);
    let netQuantity = data.netQuantity || '100g';

    // Normalize variants
    let cleanVariants: ProductVariant[] = [];
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      cleanVariants = data.variants
        .filter((v: any) => v && v.weight && !isNaN(Number(v.price)))
        .map((v: any, idx: number) => ({
          id: v.id || `var-${id}-${idx + 1}-${Date.now()}`,
          weight: String(v.weight).trim(),
          price: Number(v.price),
          mrp: Number(v.mrp || v.price),
          stock: Number(v.stock !== undefined ? v.stock : 100)
        }));

      // If base price was 0 or not provided, use first variant
      if (price <= 0 && cleanVariants.length > 0) {
        price = cleanVariants[0].price;
        mrp = cleanVariants[0].mrp;
        netQuantity = cleanVariants[0].weight;
      }
    }

    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : (data.discount || 0);
    const images = (data.images && data.images.length > 0 ? data.images : [{
      id: `img-${id}-1`,
      url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80',
      alt: data.name || 'Jalgaon Snack',
      isPrimary: true
    }]).map(img => ({
      ...img,
      url: addCloudinaryOriginalFlag(img.url)
    }));

    // Resolve category id and slug
    const resolvedCat = await this.resolveCategoryInfo(data.category, data.categoryId);

    const newProduct: Product = {
      id,
      slug,
      name: data.name || 'New Product',
      category: resolvedCat.slug,
      categoryId: resolvedCat.id,
      categoryName: resolvedCat.name,
      description: data.description || '',
      shortDescription: data.shortDescription || data.description?.slice(0, 100) || '',
      price,
      mrp,
      profit: Number(data.profit || 0),
      discount,
      netQuantity,
      flavour: data.flavour,
      tags: data.tags || ['Fresh', 'Jalgaon'],
      isFeatured: Boolean(data.isFeatured),
      isBestSeller: Boolean(data.isBestSeller),
      isNew: Boolean(data.isNew ?? true),
      isAvailable: Boolean(data.isAvailable ?? true),
      stock: Number(data.stock ?? 100),
      images,
      variants: cleanVariants.length > 0 ? cleanVariants : undefined,
      ingredients: data.ingredients || ['Fresh Bananas', 'Pure Edible Oil', 'Spices', 'Salt'],
      seoTitle: data.seoTitle || `${data.name} | Aapla Jalgaonwala`,
      seoDescription: data.seoDescription || data.shortDescription
    };

    // 1. Try MySQL Database insert
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO products (
            id, slug, name, category_id, description, short_description, price, mrp, profit, discount,
            net_quantity, flavour, tags, is_featured, is_best_seller, is_new, is_available, stock,
            seo_title, seo_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name), category_id = VALUES(category_id), description = VALUES(description),
            price = VALUES(price), mrp = VALUES(mrp), profit = VALUES(profit), stock = VALUES(stock), is_available = VALUES(is_available)`,
          [
            newProduct.id,
            newProduct.slug,
            newProduct.name,
            resolvedCat.id,
            newProduct.description,
            newProduct.shortDescription,
            newProduct.price,
            newProduct.mrp,
            newProduct.profit || 0,
            newProduct.discount,
            newProduct.netQuantity,
            newProduct.flavour || null,
            JSON.stringify(newProduct.tags),
            newProduct.isFeatured ? 1 : 0,
            newProduct.isBestSeller ? 1 : 0,
            newProduct.isNew ? 1 : 0,
            newProduct.isAvailable ? 1 : 0,
            newProduct.stock,
            newProduct.seoTitle,
            newProduct.seoDescription
          ]
        );

        // Save Primary Image in MySQL
        if (images[0]?.url) {
          await pool.query(
            `INSERT INTO product_images (id, product_id, url, alt, is_primary) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE url = VALUES(url)`,
            [`img-${id}-0`, id, images[0].url, newProduct.name, 1]
          );
        }

        // Save Variants in MySQL
        if (cleanVariants.length > 0) {
          for (const v of cleanVariants) {
            await pool.query(
              `INSERT INTO product_variants (id, product_id, weight, price, mrp, stock)
               VALUES (?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE weight = VALUES(weight), price = VALUES(price), mrp = VALUES(mrp), stock = VALUES(stock)`,
              [v.id, id, v.weight, v.price, v.mrp, v.stock ?? 100]
            );
          }
        }
      } catch (err) {
        console.warn('[ProductRepo] MySQL insert failed, saving to JSON storage fallback:', err);
      }
    }

    // 2. Save to JSON fallback storage
    await this.save(newProduct);
    return newProduct;
  }

  static async update(id: string, data: Partial<Product>): Promise<Product | null> {
    this.clearCache();
    const existing = await this.getById(id);
    if (!existing) return null;

    let price = data.price !== undefined ? Number(data.price) : existing.price;
    let mrp = data.mrp !== undefined ? Number(data.mrp) : existing.mrp;
    let netQuantity = data.netQuantity !== undefined ? data.netQuantity : existing.netQuantity;

    // Handle Variants Update
    let updatedVariants: ProductVariant[] | undefined = existing.variants;
    const vConfig = (data as any).variantConfig;

    if (vConfig) {
      const currentVariants: ProductVariant[] = Array.isArray(existing.variants) ? [...existing.variants] : [];
      if (vConfig.mode === 'replace') {
        if (Array.isArray(vConfig.variants)) {
          updatedVariants = vConfig.variants
            .filter((v: any) => v && v.weight && !isNaN(Number(v.price)))
            .map((v: any, idx: number) => ({
              id: `var-${id}-${idx + 1}-${Date.now()}`,
              weight: String(v.weight).trim(),
              price: Number(v.price),
              mrp: Number(v.mrp || v.price),
              stock: Number(v.stock !== undefined ? v.stock : 100)
            }));
        } else {
          updatedVariants = [];
        }
      } else if (vConfig.mode === 'append') {
        if (Array.isArray(vConfig.variants)) {
          const merged = [...currentVariants];
          for (const newV of vConfig.variants) {
            if (!newV || !newV.weight || isNaN(Number(newV.price))) continue;
            const normNew = String(newV.weight).toLowerCase().replace(/\s+/g, '');
            const existingIdx = merged.findIndex(
              ev => String(ev.weight).toLowerCase().replace(/\s+/g, '') === normNew
            );
            if (existingIdx >= 0) {
              merged[existingIdx] = {
                ...merged[existingIdx],
                price: Number(newV.price),
                mrp: Number(newV.mrp || newV.price),
                stock: Number(newV.stock !== undefined ? newV.stock : (merged[existingIdx].stock ?? 100))
              };
            } else {
              merged.push({
                id: `var-${id}-${merged.length + 1}-${Date.now()}`,
                weight: String(newV.weight).trim(),
                price: Number(newV.price),
                mrp: Number(newV.mrp || newV.price),
                stock: Number(newV.stock !== undefined ? newV.stock : 100)
              });
            }
          }
          updatedVariants = merged;
        }
      } else if (vConfig.mode === 'update_by_weight') {
        if (Array.isArray(vConfig.weightRules) && vConfig.weightRules.length > 0) {
          const merged = [...currentVariants];
          for (const rule of vConfig.weightRules) {
            if (!rule || !rule.targetWeight) continue;
            const normTarget = String(rule.targetWeight).toLowerCase().replace(/\s+/g, '');
            let matched = false;
            for (let i = 0; i < merged.length; i++) {
              const normWeight = String(merged[i].weight).toLowerCase().replace(/\s+/g, '');
              if (normWeight === normTarget) {
                matched = true;
                merged[i] = {
                  ...merged[i],
                  price: rule.price !== undefined && !isNaN(Number(rule.price)) ? Number(rule.price) : merged[i].price,
                  mrp: rule.mrp !== undefined && !isNaN(Number(rule.mrp)) ? Number(rule.mrp) : (merged[i].mrp || merged[i].price),
                  stock: rule.stock !== undefined && !isNaN(Number(rule.stock)) ? Number(rule.stock) : (merged[i].stock ?? 100)
                };
              }
            }
            if (!matched && rule.createIfMissing && rule.price !== undefined && !isNaN(Number(rule.price))) {
              merged.push({
                id: `var-${id}-${merged.length + 1}-${Date.now()}`,
                weight: String(rule.targetWeight).trim(),
                price: Number(rule.price),
                mrp: Number(rule.mrp || rule.price),
                stock: Number(rule.stock !== undefined ? rule.stock : 100)
              });
            }
          }
          updatedVariants = merged;
        }
      } else if (vConfig.mode === 'adjust_prices') {
        if (vConfig.priceAdjustment) {
          const { type, value } = vConfig.priceAdjustment;
          const numVal = Number(value) || 0;
          updatedVariants = currentVariants.map(v => {
            let newPrice = v.price;
            let newMrp = v.mrp || v.price;
            if (type === 'percentage') {
              newPrice = Math.max(1, Math.round(v.price * (1 + numVal / 100)));
              newMrp = Math.max(newPrice, Math.round((v.mrp || v.price) * (1 + numVal / 100)));
            } else if (type === 'fixed_increase') {
              newPrice = Math.max(1, v.price + numVal);
              newMrp = Math.max(newPrice, (v.mrp || v.price) + numVal);
            } else if (type === 'fixed_decrease') {
              newPrice = Math.max(1, v.price - numVal);
              newMrp = Math.max(newPrice, (v.mrp || v.price) - numVal);
            }
            return {
              ...v,
              price: newPrice,
              mrp: newMrp
            };
          });
        }
      } else if (vConfig.mode === 'remove_all') {
        updatedVariants = [];
      }
    } else if (data.variants !== undefined) {
      if (Array.isArray(data.variants)) {
        updatedVariants = data.variants
          .filter((v: any) => v && v.weight && !isNaN(Number(v.price)))
          .map((v: any, idx: number) => ({
            id: v.id || `var-${id}-${idx + 1}-${Date.now()}`,
            weight: String(v.weight).trim(),
            price: Number(v.price),
            mrp: Number(v.mrp || v.price),
            stock: Number(v.stock !== undefined ? v.stock : 100)
          }));
      } else {
        updatedVariants = [];
      }
    }

    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : (data.discount ?? existing.discount);

    // Resolve category if updated or existing
    const catInput = data.category !== undefined ? data.category : existing.category;
    const catIdInput = data.categoryId !== undefined ? data.categoryId : (data.category !== undefined ? undefined : existing.categoryId);
    const resolvedCat = await this.resolveCategoryInfo(catInput, catIdInput);

    // Normalize tags if provided as string
    let parsedTags: string[] = existing.tags || [];
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        parsedTags = data.tags;
      } else if (typeof data.tags === 'string') {
        parsedTags = (data.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    const updatedProduct: Product = {
      ...existing,
      ...data,
      id: existing.id,
      category: resolvedCat.slug,
      categoryId: resolvedCat.id,
      categoryName: resolvedCat.name,
      price,
      mrp,
      profit: data.profit !== undefined ? Number(data.profit) : (existing.profit || 0),
      discount,
      netQuantity,
      tags: parsedTags,
      variants: updatedVariants && updatedVariants.length > 0 ? updatedVariants : undefined,
      images: (data.images && data.images.length > 0)
        ? data.images
        : (data.imageUrl
          ? [{ id: `img-${id}-0`, url: data.imageUrl, alt: data.name || existing.name, isPrimary: true }]
          : existing.images),
      comboImages: data.comboImages !== undefined ? data.comboImages : existing.comboImages
    };

    const pool = getDbPool();
    if (pool) {
      try {
        const comboImagesJson = updatedProduct.comboImages ? JSON.stringify(updatedProduct.comboImages) : null;
        try {
          await pool.query(
            `UPDATE products SET
              name = ?, category_id = ?, description = ?, short_description = ?,
              price = ?, mrp = ?, profit = ?, discount = ?, net_quantity = ?, flavour = ?,
              tags = ?, is_featured = ?, is_best_seller = ?, is_new = ?,
              is_available = ?, stock = ?, seo_title = ?, seo_description = ?,
              combo_images = ?,
              updated_at = NOW()
            WHERE id = ?`,
            [
              updatedProduct.name,
              resolvedCat.id,
              updatedProduct.description,
              updatedProduct.shortDescription,
              updatedProduct.price,
              updatedProduct.mrp,
              updatedProduct.profit || 0,
              updatedProduct.discount,
              updatedProduct.netQuantity,
              updatedProduct.flavour || null,
              JSON.stringify(updatedProduct.tags),
              updatedProduct.isFeatured ? 1 : 0,
              updatedProduct.isBestSeller ? 1 : 0,
              updatedProduct.isNew ? 1 : 0,
              updatedProduct.isAvailable ? 1 : 0,
              updatedProduct.stock,
              updatedProduct.seoTitle,
              updatedProduct.seoDescription,
              comboImagesJson,
              id
            ]
          );
        } catch (sqlErr: any) {
          // Fallback if combo_images column is being created or schema is syncing
          await pool.query(
            `UPDATE products SET
              name = ?, category_id = ?, description = ?, short_description = ?,
              price = ?, mrp = ?, profit = ?, discount = ?, net_quantity = ?, flavour = ?,
              tags = ?, is_featured = ?, is_best_seller = ?, is_new = ?,
              is_available = ?, stock = ?, seo_title = ?, seo_description = ?,
              updated_at = NOW()
            WHERE id = ?`,
            [
              updatedProduct.name,
              resolvedCat.id,
              updatedProduct.description,
              updatedProduct.shortDescription,
              updatedProduct.price,
              updatedProduct.mrp,
              updatedProduct.profit || 0,
              updatedProduct.discount,
              updatedProduct.netQuantity,
              updatedProduct.flavour || null,
              JSON.stringify(updatedProduct.tags),
              updatedProduct.isFeatured ? 1 : 0,
              updatedProduct.isBestSeller ? 1 : 0,
              updatedProduct.isNew ? 1 : 0,
              updatedProduct.isAvailable ? 1 : 0,
              updatedProduct.stock,
              updatedProduct.seoTitle,
              updatedProduct.seoDescription,
              id
            ]
          );
        }

        if (updatedProduct.images && updatedProduct.images.length > 0) {
          updatedProduct.images = updatedProduct.images.map(img => ({
            ...img,
            url: addCloudinaryOriginalFlag(img.url)
          }));
          await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
          for (let i = 0; i < updatedProduct.images.length; i++) {
            const img = updatedProduct.images[i];
            if (!img || !img.url) continue;
            await pool.query(
              `INSERT INTO product_images (id, product_id, url, alt, is_primary) VALUES (?, ?, ?, ?, ?)`,
              [img.id || `img-${id}-${i}`, id, img.url, img.alt || updatedProduct.name, i === 0 ? 1 : (img.isPrimary ? 1 : 0)]
            );
          }
        }

        // Sync MySQL product_variants table
        if (data.variants !== undefined || vConfig) {
          await pool.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
          if (updatedVariants && updatedVariants.length > 0) {
            for (const v of updatedVariants) {
              await pool.query(
                `INSERT INTO product_variants (id, product_id, weight, price, mrp, stock)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [v.id, id, v.weight, v.price, v.mrp, v.stock ?? 100]
              );
            }
          }
        }
      } catch (err) {
        console.warn('[ProductRepo] MySQL update failed, updating JSON storage fallback:', err);
      }
    }

    await this.save(updatedProduct);
    this.clearCache();
    return updatedProduct;
  }

  static async bulkUpdate(ids: string[], updates: Partial<Product>): Promise<{ updatedCount: number; products: Product[] }> {
    this.clearCache();
    const updatedProducts: Product[] = [];
    for (const id of ids) {
      const updated = await this.update(String(id), updates);
      if (updated) {
        updatedProducts.push(updated);
      }
    }
    return { updatedCount: updatedProducts.length, products: updatedProducts };
  }

  static async delete(id: string): Promise<boolean> {
    this.clearCache();
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
        await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[ProductRepo] MySQL delete failed:', err);
      }
    }

    const products = await readJson<Product[]>(FILE_NAME, []);
    const filtered = products.filter(p => p.id !== id);
    await writeJson(FILE_NAME, filtered);
    return true;
  }

  static async save(product: Product): Promise<Product> {
    this.clearCache();
    const products = await readJson<Product[]>(FILE_NAME, []);
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    await writeJson(FILE_NAME, products);
    return product;
  }
}




