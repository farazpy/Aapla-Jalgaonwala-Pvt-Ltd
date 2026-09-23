import { ProductReview } from '@/types';
import { initialReviews } from '@/data/reviews';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { ProductRepository } from './ProductRepository';
import { SettingsRepository } from './SettingsRepository';

const FILE_NAME = 'reviews.json';

let reviewMemoryCache: { data: ProductReview[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 60s memory cache

export class ReviewRepository {
  public static clearCache() {
    reviewMemoryCache = null;
  }

  private static async getRawList(): Promise<ProductReview[]> {
    if (reviewMemoryCache && (Date.now() - reviewMemoryCache.timestamp < CACHE_TTL_MS)) {
      return reviewMemoryCache.data;
    }

    const pool = getDbPool();
    let reviews: ProductReview[] = [];

    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM product_reviews ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          reviews = rows.map((r: any) => ({
            id: String(r.id),
            productId: String(r.product_id),
            productName: r.product_name,
            productSlug: r.product_slug,
            customerName: r.customer_name,
            customerEmail: r.customer_email,
            userId: r.user_id,
            rating: Number(r.rating) || 5,
            title: r.title || '',
            comment: r.comment || '',
            isVerified: Boolean(r.is_verified),
            status: r.status || 'approved',
            adminReply: r.admin_reply,
            adminRepliedAt: r.admin_replied_at,
            likes: Number(r.likes) || 0,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
          }));
          reviewMemoryCache = { data: reviews, timestamp: Date.now() };
          return reviews;
        }
      } catch (err: any) {
        if (err?.code !== 'ER_NO_SUCH_TABLE' && !err?.message?.includes("doesn't exist")) {
          console.warn('[MySQL] Error querying product_reviews, using JSON fallback:', err?.message || err);
        }
      }
    }

    reviews = await readJson<ProductReview[]>(FILE_NAME, initialReviews);
    reviewMemoryCache = { data: reviews, timestamp: Date.now() };
    return reviews;
  }

  public static async getAll(filter?: {
    productId?: string;
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    rating?: number;
    search?: string;
  }): Promise<ProductReview[]> {
    let reviews = await this.getRawList();

    if (filter) {
      if (filter.productId) {
        const pId = filter.productId.toLowerCase();
        reviews = reviews.filter(
          r => r.productId.toLowerCase() === pId || (r.productSlug && r.productSlug.toLowerCase() === pId)
        );
      }

      if (filter.status && filter.status !== 'all') {
        reviews = reviews.filter(r => r.status === filter.status);
      }

      if (filter.rating && filter.rating > 0) {
        reviews = reviews.filter(r => Math.floor(r.rating) === filter.rating);
      }

      if (filter.search && filter.search.trim()) {
        const q = filter.search.trim().toLowerCase();
        reviews = reviews.filter(
          r =>
            r.customerName.toLowerCase().includes(q) ||
            (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
            (r.title && r.title.toLowerCase().includes(q)) ||
            (r.comment && r.comment.toLowerCase().includes(q)) ||
            (r.productName && r.productName.toLowerCase().includes(q))
        );
      }
    }

    // Sort newest first
    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async getByProductId(
    productIdOrSlug: string,
    onlyApproved: boolean = true
  ): Promise<{
    reviews: ProductReview[];
    totalCount: number;
    averageRating: number;
    distribution: Record<number, number>;
    percentages: Record<number, number>;
  }> {
    const all = await this.getRawList();
    const query = productIdOrSlug.toLowerCase();

    let matched = all.filter(
      r => r.productId.toLowerCase() === query || (r.productSlug && r.productSlug.toLowerCase() === query)
    );

    if (onlyApproved) {
      matched = matched.filter(r => r.status === 'approved');
    }

    matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalCount = matched.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    let sum = 0;
    matched.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[rounded] = (distribution[rounded] || 0) + 1;
      sum += r.rating;
    });

    const averageRating = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 5.0;

    const percentages: Record<number, number> = {
      5: totalCount > 0 ? Math.round((distribution[5] / totalCount) * 100) : 0,
      4: totalCount > 0 ? Math.round((distribution[4] / totalCount) * 100) : 0,
      3: totalCount > 0 ? Math.round((distribution[3] / totalCount) * 100) : 0,
      2: totalCount > 0 ? Math.round((distribution[2] / totalCount) * 100) : 0,
      1: totalCount > 0 ? Math.round((distribution[1] / totalCount) * 100) : 0
    };

    return {
      reviews: matched,
      totalCount,
      averageRating,
      distribution,
      percentages
    };
  }

  public static async getById(id: string): Promise<ProductReview | null> {
    const list = await this.getRawList();
    return list.find(r => r.id === id) || null;
  }

  public static async create(data: {
    productId: string;
    productName?: string;
    productSlug?: string;
    customerName: string;
    customerEmail?: string;
    userId?: string;
    rating: number;
    title?: string;
    comment?: string;
    isVerified?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<ProductReview> {
    this.clearCache();
    const list = await this.getRawList();

    // Look up product to ensure accurate name & slug
    let pName = data.productName;
    let pSlug = data.productSlug;
    if (!pName || !pSlug) {
      try {
        const prod = await ProductRepository.getById(data.productId) || await ProductRepository.getBySlug(data.productId);
        if (prod) {
          pName = prod.name;
          pSlug = prod.slug;
        }
      } catch {
        // continue
      }
    }

    // Check settings for auto approval if status not explicitly passed
    let status = data.status;
    if (!status) {
      const settings = await SettingsRepository.getSettings();
      status = settings.reviewAutoApprove ? 'approved' : 'pending';
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: data.productId,
      productName: pName || 'Product',
      productSlug: pSlug,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail?.trim(),
      userId: data.userId,
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      title: data.title?.trim() || undefined,
      comment: data.comment?.trim() || '',
      isVerified: Boolean(data.isVerified),
      status: status,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO product_reviews (
            id, product_id, product_name, product_slug, customer_name, customer_email, user_id,
            rating, title, comment, is_verified, status, admin_reply, admin_replied_at, likes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            newReview.id,
            newReview.productId,
            newReview.productName,
            newReview.productSlug || null,
            newReview.customerName,
            newReview.customerEmail || null,
            newReview.userId || null,
            newReview.rating,
            newReview.title || null,
            newReview.comment || '',
            newReview.isVerified ? 1 : 0,
            newReview.status || 'pending',
            null,
            null,
            0
          ]
        );
      } catch (err) {
        console.warn('[MySQL] Single review insert failed:', err);
      }
    }

    list.unshift(newReview);
    await writeJson(FILE_NAME, list);

    // If approved, update aggregate product rating
    if (newReview.status === 'approved') {
      await this.recalculateProductRating(newReview.productId);
    }

    return newReview;
  }

  public static async update(id: string, updates: Partial<ProductReview>): Promise<ProductReview | null> {
    this.clearCache();
    const list = await this.getRawList();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return null;

    const oldReview = list[index];
    const updatedReview: ProductReview = {
      ...oldReview,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.adminReply !== undefined && updates.adminReply !== oldReview.adminReply) {
      updatedReview.adminRepliedAt = updates.adminReply ? new Date().toISOString() : undefined;
    }

    const pool = getDbPool();
    if (pool) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
        if (updates.rating !== undefined) { fields.push('rating = ?'); values.push(updates.rating); }
        if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
        if (updates.comment !== undefined) { fields.push('comment = ?'); values.push(updates.comment); }
        if (updates.adminReply !== undefined) { 
          fields.push('admin_reply = ?'); values.push(updates.adminReply);
          fields.push('admin_replied_at = ?'); values.push(updatedReview.adminRepliedAt ? new Date(updatedReview.adminRepliedAt) : null);
        }
        if (updates.likes !== undefined) { fields.push('likes = ?'); values.push(updates.likes); }
        if (fields.length > 0) {
          fields.push('updated_at = NOW()');
          values.push(id);
          await pool.query(`UPDATE product_reviews SET ${fields.join(', ')} WHERE id = ?`, values);
        }
      } catch (err) {
        console.warn('[MySQL] Error updating product_review:', err);
      }
    }

    list[index] = updatedReview;
    await writeJson(FILE_NAME, list);

    // Recalculate product rating
    await this.recalculateProductRating(updatedReview.productId);
    if (oldReview.productId !== updatedReview.productId) {
      await this.recalculateProductRating(oldReview.productId);
    }

    return updatedReview;
  }

  public static async delete(id: string): Promise<boolean> {
    this.clearCache();
    const list = await this.getRawList();
    const target = list.find(r => r.id === id);
    if (!target) return false;

    const filtered = list.filter(r => r.id !== id);
    await writeJson(FILE_NAME, filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM product_reviews WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[MySQL] Error deleting product_review:', err);
      }
    }

    this.clearCache();
    // Recalculate rating
    await this.recalculateProductRating(target.productId);
    return true;
  }

  public static async bulkUpdateStatus(ids: string[], status: 'approved' | 'rejected' | 'pending'): Promise<number> {
    this.clearCache();
    const list = await this.getRawList();
    const affectedProductIds = new Set<string>();
    let count = 0;

    const updatedList = list.map(r => {
      if (ids.includes(r.id)) {
        affectedProductIds.add(r.productId);
        count++;
        return {
          ...r,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await writeJson(FILE_NAME, updatedList);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('UPDATE product_reviews SET status = ?, updated_at = NOW() WHERE id IN (?)', [status, ids]);
      } catch (err) {
        console.warn('[MySQL] Error bulk updating product_reviews status:', err);
      }
    }

    for (const pId of affectedProductIds) {
      await this.recalculateProductRating(pId);
    }

    return count;
  }

  public static async bulkDelete(ids: string[]): Promise<number> {
    this.clearCache();
    const list = await this.getRawList();
    const affectedProductIds = new Set<string>();
    let count = 0;

    const filtered = list.filter(r => {
      if (ids.includes(r.id)) {
        affectedProductIds.add(r.productId);
        count++;
        return false;
      }
      return true;
    });

    await writeJson(FILE_NAME, filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM product_reviews WHERE id IN (?)', [ids]);
      } catch (err) {
        console.warn('[MySQL] Error bulk deleting product_reviews:', err);
      }
    }

    for (const pId of affectedProductIds) {
      await this.recalculateProductRating(pId);
    }

    return count;
  }

  public static async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageRating: number;
  }> {
    const list = await this.getRawList();
    const total = list.length;
    const pending = list.filter(r => r.status === 'pending').length;
    const approved = list.filter(r => r.status === 'approved').length;
    const rejected = list.filter(r => r.status === 'rejected').length;

    const approvedList = list.filter(r => r.status === 'approved');
    const totalScore = approvedList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const averageRating = approvedList.length > 0 ? Number((totalScore / approvedList.length).toFixed(1)) : 5.0;

    return {
      total,
      pending,
      approved,
      rejected,
      averageRating
    };
  }

  public static async recalculateProductRating(productIdOrSlug: string): Promise<void> {
    try {
      const stats = await this.getByProductId(productIdOrSlug, true);
      const prod = await ProductRepository.getById(productIdOrSlug) || await ProductRepository.getBySlug(productIdOrSlug);

      if (prod) {
        await ProductRepository.update(prod.id, {
          rating: stats.averageRating,
          reviewsCount: stats.totalCount
        });
      }
    } catch (err) {
      console.warn('[ReviewRepository] Error updating product rating cache:', err);
    }
  }
}
