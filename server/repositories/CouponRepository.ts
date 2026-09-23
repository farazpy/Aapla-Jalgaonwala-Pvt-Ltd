import { Coupon, CartItem } from '@/types';
import { readJson, writeJson, clearJsonCache } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const FILE_NAME = 'coupons.json';
const SEED_MARKER = '.coupons_initialized.json';

export const initialCoupons: Coupon[] = [];

let couponMemoryCache: { data: Coupon[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000;

function safeParseArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'object') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export class CouponRepository {
  public static clearCache() {
    couponMemoryCache = null;
    clearJsonCache(FILE_NAME);
  }

  private static mapRowToCoupon(r: any): Coupon {
    const rawCode = r.code || r.coupon_code || '';
    const code = String(rawCode).trim().toUpperCase();
    const type = (r.type || r.discount_type || r.discountType || 'percentage') as any;
    const value = Number(r.value ?? r.discount_value ?? r.discountValue ?? 0);
    const minOrder = Number(r.minimum_order ?? r.min_order_amount ?? r.minimum_order_amount ?? r.minimumOrder ?? r.minOrderAmount ?? 0);
    const maxDisc = (r.maximum_discount ?? r.max_discount ?? r.maximumDiscount ?? r.maxDiscount) != null
      ? Number(r.maximum_discount ?? r.max_discount ?? r.maximumDiscount ?? r.maxDiscount)
      : undefined;

    const startsAt = r.starts_at || r.start_date || r.starts_date || r.startsAt || r.startDate || undefined;
    const expiresAt = r.expires_at || r.expiry_date || r.expires_date || r.expiresAt || r.expiryDate || undefined;

    let isActive = true;
    if (r.isActive !== undefined) {
      isActive = Boolean(r.isActive);
    } else if (r.is_active !== undefined) {
      isActive = Boolean(Number(r.is_active));
    } else if (r.status !== undefined) {
      isActive = r.status === 'active' || r.status === 1 || r.status === true;
    }

    let isAutoApply = false;
    if (r.isAutoApply !== undefined) {
      isAutoApply = Boolean(r.isAutoApply);
    } else if (r.is_auto_apply !== undefined) {
      isAutoApply = Boolean(Number(r.is_auto_apply));
    }

    let firstTimeUserOnly = false;
    if (r.firstTimeUserOnly !== undefined) {
      firstTimeUserOnly = Boolean(r.firstTimeUserOnly);
    } else if (r.first_time_user_only !== undefined) {
      firstTimeUserOnly = Boolean(Number(r.first_time_user_only));
    }

    const categories = safeParseArray(r.applicable_categories || r.applicableCategories);
    const productIds = safeParseArray(r.applicable_product_ids || r.applicableProductIds || r.applicable_products || r.applicableProducts);

    let isStoreWide = true;
    if (r.isStoreWide !== undefined) {
      isStoreWide = Boolean(r.isStoreWide);
    } else if (r.is_store_wide !== undefined) {
      isStoreWide = Boolean(Number(r.is_store_wide));
    } else if (categories.length > 0 || productIds.length > 0) {
      isStoreWide = false;
    }

    return {
      id: r.id || `cpn_${code.toLowerCase()}`,
      code,
      description: r.description || `Discount Coupon ${code}`,
      type,
      discountType: type,
      value,
      discountValue: value,
      minimumOrder: minOrder,
      minOrderAmount: minOrder,
      maximumDiscount: maxDisc,
      maxDiscount: maxDisc,
      isStoreWide,
      applicableCategories: categories,
      applicableProductIds: productIds,
      applicableProducts: productIds,
      usageLimit: r.usage_limit != null ? Number(r.usage_limit) : (r.usageLimit != null ? Number(r.usageLimit) : undefined),
      usageCount: Number(r.usage_count || r.used_count || r.usageCount || r.usedCount || 0),
      usedCount: Number(r.usage_count || r.used_count || r.usageCount || r.usedCount || 0),
      usageLimitPerUser: r.usage_limit_per_user != null ? Number(r.usage_limit_per_user) : (r.usageLimitPerUser != null ? Number(r.usageLimitPerUser) : undefined),
      firstTimeUserOnly,
      paymentMethodRestriction: r.payment_method_restriction || r.paymentMethodRestriction || 'all',
      minItemQuantity: r.min_item_quantity != null ? Number(r.min_item_quantity) : (r.minItemQuantity != null ? Number(r.minItemQuantity) : undefined),
      startsAt,
      startDate: startsAt,
      expiresAt,
      expiryDate: expiresAt,
      isActive,
      isAutoApply,
      autoApplyTitle: r.auto_apply_title || r.autoApplyTitle || undefined,
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt || new Date().toISOString()
    };
  }

  static async getAll(): Promise<Coupon[]> {
    if (couponMemoryCache && (Date.now() - couponMemoryCache.timestamp < CACHE_TTL_MS)) {
      return couponMemoryCache.data;
    }

    const pool = getDbPool();
    let coupons: Coupon[] = [];

    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          coupons = rows.map((r: any) => this.mapRowToCoupon(r));
          couponMemoryCache = { data: coupons, timestamp: Date.now() };
          return coupons;
        }
      } catch (err) {
        console.warn('[CouponRepo] MySQL query failed, using JSON fallback:', err);
      }
    }

    const jsonCoupons = await readJson<Coupon[]>(FILE_NAME, []);
    coupons = (jsonCoupons || []).map(item => this.mapRowToCoupon(item));
    couponMemoryCache = { data: coupons, timestamp: Date.now() };
    return coupons;
  }

  static async getById(id: string): Promise<Coupon | null> {
    const coupons = await this.getAll();
    return coupons.find(c => c.id === id) || null;
  }

  static async getByCode(code: string): Promise<Coupon | null> {
    if (!code) return null;
    const formattedCode = code.trim().toUpperCase();

    // Check memory / cache first
    const coupons = await this.getAll();
    const found = coupons.find(c => c.code.toUpperCase() === formattedCode);
    if (found) return found;

    // Direct MySQL fallback check if cache missed
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT * FROM coupons WHERE UPPER(code) = ? OR UPPER(id) = ? LIMIT 1',
          [formattedCode, formattedCode]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return this.mapRowToCoupon(rows[0]);
        }
      } catch (err) {
        console.warn('[CouponRepo] MySQL getByCode fallback failed:', err);
      }
    }

    return null;
  }

  static async create(couponData: Partial<Coupon>): Promise<Coupon> {
    this.clearCache();
    const coupons = await this.getAll();
    const code = (couponData.code || `PROMO${Date.now().toString().slice(-4)}`).trim().toUpperCase();

    // Check duplicate code
    const existing = coupons.find(c => c.code.toUpperCase() === code);
    if (existing) {
      throw new Error(`Coupon with code "${code}" already exists.`);
    }

    const type = couponData.type || couponData.discountType || 'percentage';
    const value = Number(couponData.value ?? couponData.discountValue ?? 0);
    const minOrder = Number(couponData.minimumOrder ?? couponData.minOrderAmount ?? 0);
    const maxDisc = couponData.maximumDiscount ?? couponData.maxDiscount;
    const starts = couponData.startsAt || couponData.startDate;
    const expires = couponData.expiresAt || couponData.expiryDate;

    const newCoupon: Coupon = {
      id: couponData.id || `cpn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code,
      description: couponData.description || `Special discount coupon ${code}`,
      type: type as any,
      discountType: type as any,
      value,
      discountValue: value,
      minimumOrder: minOrder,
      minOrderAmount: minOrder,
      maximumDiscount: maxDisc !== undefined && maxDisc !== null ? Number(maxDisc) : undefined,
      maxDiscount: maxDisc !== undefined && maxDisc !== null ? Number(maxDisc) : undefined,
      isStoreWide: couponData.isStoreWide !== undefined ? Boolean(couponData.isStoreWide) : ((couponData.applicableCategories?.length || 0) === 0 && (couponData.applicableProductIds?.length || 0) === 0),
      applicableCategories: Array.isArray(couponData.applicableCategories) ? couponData.applicableCategories : [],
      applicableProductIds: Array.isArray(couponData.applicableProductIds) ? couponData.applicableProductIds : (Array.isArray(couponData.applicableProducts) ? couponData.applicableProducts : []),
      usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : undefined,
      usageCount: 0,
      usedCount: 0,
      usageLimitPerUser: couponData.usageLimitPerUser ? Number(couponData.usageLimitPerUser) : undefined,
      firstTimeUserOnly: Boolean(couponData.firstTimeUserOnly),
      paymentMethodRestriction: couponData.paymentMethodRestriction || 'all',
      minItemQuantity: couponData.minItemQuantity ? Number(couponData.minItemQuantity) : undefined,
      startsAt: starts || undefined,
      startDate: starts || undefined,
      expiresAt: expires || undefined,
      expiryDate: expires || undefined,
      isActive: couponData.isActive !== undefined ? Boolean(couponData.isActive) : true,
      isAutoApply: Boolean(couponData.isAutoApply),
      autoApplyTitle: couponData.autoApplyTitle || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    coupons.unshift(newCoupon);
    await writeJson(FILE_NAME, coupons);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO coupons (id, code, description, type, value, minimum_order, maximum_discount, is_store_wide, applicable_categories, applicable_product_ids, usage_limit, usage_count, starts_at, expires_at, is_active, is_auto_apply, auto_apply_title, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE description=VALUES(description), type=VALUES(type), value=VALUES(value), minimum_order=VALUES(minimum_order), maximum_discount=VALUES(maximum_discount), is_store_wide=VALUES(is_store_wide), is_active=VALUES(is_active), is_auto_apply=VALUES(is_auto_apply), auto_apply_title=VALUES(auto_apply_title)`,
          [
            newCoupon.id,
            newCoupon.code,
            newCoupon.description,
            newCoupon.type,
            newCoupon.value,
            newCoupon.minimumOrder,
            newCoupon.maximumDiscount || null,
            newCoupon.isStoreWide ? 1 : 0,
            JSON.stringify(newCoupon.applicableCategories || []),
            JSON.stringify(newCoupon.applicableProductIds || []),
            newCoupon.usageLimit || null,
            newCoupon.usageCount || 0,
            newCoupon.startsAt || null,
            newCoupon.expiresAt || null,
            newCoupon.isActive ? 1 : 0,
            newCoupon.isAutoApply ? 1 : 0,
            newCoupon.autoApplyTitle || null,
            newCoupon.createdAt
          ]
        );
      } catch (err) {
        console.warn('[CouponRepo] MySQL insert warning:', err);
      }
    }

    this.clearCache();
    return newCoupon;
  }

  static async update(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    this.clearCache();
    const coupons = await this.getAll();
    const index = coupons.findIndex(c => c.id === id || c.code.toUpperCase() === id.toUpperCase());
    if (index === -1) return null;

    const current = coupons[index];
    const code = updates.code ? updates.code.trim().toUpperCase() : current.code;

    if (code !== current.code) {
      const collision = coupons.find(c => c.id !== current.id && c.code.toUpperCase() === code);
      if (collision) {
        throw new Error(`Coupon code "${code}" is already in use by another coupon.`);
      }
    }

    const type = updates.type || updates.discountType || current.type;
    const value = updates.value !== undefined ? Number(updates.value) : (updates.discountValue !== undefined ? Number(updates.discountValue) : current.value);
    const minOrder = updates.minimumOrder !== undefined ? Number(updates.minimumOrder) : (updates.minOrderAmount !== undefined ? Number(updates.minOrderAmount) : current.minimumOrder);
    const maxDisc = updates.maximumDiscount !== undefined ? updates.maximumDiscount : updates.maxDiscount;
    const starts = updates.startsAt || updates.startDate || current.startsAt;
    const expires = updates.expiresAt || updates.expiryDate || current.expiresAt;

    const updated: Coupon = {
      ...current,
      ...updates,
      code,
      type: type as any,
      discountType: type as any,
      value,
      discountValue: value,
      minimumOrder: minOrder,
      minOrderAmount: minOrder,
      maximumDiscount: maxDisc !== undefined && maxDisc !== null ? Number(maxDisc) : current.maximumDiscount,
      maxDiscount: maxDisc !== undefined && maxDisc !== null ? Number(maxDisc) : current.maximumDiscount,
      isStoreWide: updates.isStoreWide !== undefined ? Boolean(updates.isStoreWide) : current.isStoreWide,
      isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : current.isActive,
      isAutoApply: updates.isAutoApply !== undefined ? Boolean(updates.isAutoApply) : current.isAutoApply,
      autoApplyTitle: updates.autoApplyTitle !== undefined ? (updates.autoApplyTitle || undefined) : current.autoApplyTitle,
      firstTimeUserOnly: updates.firstTimeUserOnly !== undefined ? Boolean(updates.firstTimeUserOnly) : current.firstTimeUserOnly,
      paymentMethodRestriction: updates.paymentMethodRestriction || current.paymentMethodRestriction || 'all',
      minItemQuantity: updates.minItemQuantity !== undefined ? (updates.minItemQuantity ? Number(updates.minItemQuantity) : undefined) : current.minItemQuantity,
      usageLimitPerUser: updates.usageLimitPerUser !== undefined ? (updates.usageLimitPerUser ? Number(updates.usageLimitPerUser) : undefined) : current.usageLimitPerUser,
      startsAt: starts || undefined,
      startDate: starts || undefined,
      expiresAt: expires || undefined,
      expiryDate: expires || undefined,
      updatedAt: new Date().toISOString()
    };

    coupons[index] = updated;
    await writeJson(FILE_NAME, coupons);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE coupons SET
            code = ?, description = ?, type = ?, value = ?, minimum_order = ?, maximum_discount = ?,
            is_store_wide = ?, applicable_categories = ?, applicable_product_ids = ?,
            usage_limit = ?, starts_at = ?, expires_at = ?, is_active = ?, is_auto_apply = ?, auto_apply_title = ?, updated_at = ?
           WHERE id = ? OR code = ?`,
          [
            updated.code,
            updated.description || null,
            updated.type,
            updated.value,
            updated.minimumOrder,
            updated.maximumDiscount || null,
            updated.isStoreWide ? 1 : 0,
            JSON.stringify(updated.applicableCategories || []),
            JSON.stringify(updated.applicableProductIds || []),
            updated.usageLimit || null,
            updated.startsAt || null,
            updated.expiresAt || null,
            updated.isActive ? 1 : 0,
            updated.isAutoApply ? 1 : 0,
            updated.autoApplyTitle || null,
            updated.updatedAt,
            updated.id,
            updated.code
          ]
        );
      } catch (err) {
        console.warn('[CouponRepo] MySQL update warning:', err);
      }
    }

    this.clearCache();
    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    this.clearCache();
    const coupons = await this.getAll();
    const filtered = coupons.filter(c => c.id !== id && c.code.toUpperCase() !== id.toUpperCase());
    if (filtered.length === coupons.length) return false;

    await writeJson(FILE_NAME, filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM coupons WHERE id = ? OR code = ?', [id, id]);
      } catch (err) {
        console.warn('[CouponRepo] MySQL delete warning:', err);
      }
    }

    this.clearCache();
    return true;
  }

  static async incrementUsage(code: string): Promise<void> {
    this.clearCache();
    const coupons = await this.getAll();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (coupon) {
      coupon.usageCount = (coupon.usageCount || 0) + 1;
      await writeJson(FILE_NAME, coupons);

      const pool = getDbPool();
      if (pool) {
        try {
          await pool.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?', [coupon.code]);
        } catch (err) {
          console.warn('[CouponRepo] MySQL usage increment warning:', err);
        }
      }
    }
  }

  /**
   * Validate coupon criteria against cart
   */
  static async validate(
    code: string,
    cartTotal: number,
    items?: CartItem[],
    options?: { isFirstTimeUser?: boolean; paymentMethod?: string }
  ): Promise<{ valid: boolean; coupon?: Coupon; discount: number; reason?: string }> {
    if (!code || !code.trim()) {
      return { valid: false, discount: 0, reason: 'Please enter a coupon code.' };
    }

    const coupon = await this.getByCode(code);
    if (!coupon) {
      return { valid: false, discount: 0, reason: `Coupon code "${code.toUpperCase()}" is not valid.` };
    }

    if (!coupon.isActive) {
      return { valid: false, discount: 0, reason: `Coupon "${coupon.code}" is currently disabled.` };
    }

    // Check validity dates
    const now = new Date();
    const startsAt = coupon.startsAt || coupon.startDate;
    const expiresAt = coupon.expiresAt || coupon.expiryDate;
    if (startsAt && new Date(startsAt) > now) {
      return { valid: false, discount: 0, reason: `Coupon "${coupon.code}" is not yet active.` };
    }
    if (expiresAt && new Date(expiresAt) < now) {
      return { valid: false, discount: 0, reason: `Coupon "${coupon.code}" has expired.` };
    }

    // Check usage limits
    const usageCount = coupon.usageCount ?? coupon.usedCount ?? 0;
    if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, reason: `Coupon "${coupon.code}" usage limit has been reached.` };
    }

    // Check minimum order subtotal
    const minOrder = coupon.minimumOrder ?? coupon.minOrderAmount ?? 0;
    if (minOrder > 0 && cartTotal < minOrder) {
      return {
        valid: false,
        discount: 0,
        reason: `Minimum cart subtotal of ₹${minOrder} required for coupon "${coupon.code}". (Current: ₹${cartTotal})`
      };
    }

    // Check first time user criteria
    if (coupon.firstTimeUserOnly && options?.isFirstTimeUser === false) {
      return {
        valid: false,
        discount: 0,
        reason: `Coupon "${coupon.code}" is valid for first-time orders only.`
      };
    }

    // Check payment method restriction
    if (coupon.paymentMethodRestriction && coupon.paymentMethodRestriction !== 'all' && options?.paymentMethod) {
      if (coupon.paymentMethodRestriction === 'online' && options.paymentMethod === 'cod') {
        return {
          valid: false,
          discount: 0,
          reason: `Coupon "${coupon.code}" is applicable on online prepaid orders only.`
        };
      }
      if (coupon.paymentMethodRestriction === 'cod' && options.paymentMethod !== 'cod') {
        return {
          valid: false,
          discount: 0,
          reason: `Coupon "${coupon.code}" is applicable on Cash on Delivery orders only.`
        };
      }
    }

    // Check minimum total item count
    if (items && items.length > 0 && coupon.minItemQuantity) {
      const totalItemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      if (totalItemCount < coupon.minItemQuantity) {
        return {
          valid: false,
          discount: 0,
          reason: `Minimum ${coupon.minItemQuantity} total items required in cart for coupon "${coupon.code}".`
        };
      }
    }

    // Check category / product criteria if not storewide
    let eligibleSubtotal = cartTotal;
    if (!coupon.isStoreWide && items && items.length > 0) {
      const hasCategories = Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0;
      const hasProducts = Array.isArray(coupon.applicableProductIds) && coupon.applicableProductIds.length > 0;

      if (hasCategories || hasProducts) {
        const eligibleItems = items.filter(item => {
          const catMatch = hasCategories && coupon.applicableCategories!.includes(item.product.category);
          const prodMatch = hasProducts && coupon.applicableProductIds!.includes(item.product.id);
          return catMatch || prodMatch;
        });

        if (eligibleItems.length === 0) {
          return {
            valid: false,
            discount: 0,
            reason: `Coupon "${coupon.code}" only applies to specific categories (${coupon.applicableCategories?.join(', ') || 'selected items'}).`
          };
        }

        eligibleSubtotal = eligibleItems.reduce((sum, it) => {
          const price = it.selectedVariant?.price || it.product.price;
          return sum + price * it.quantity;
        }, 0);
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((eligibleSubtotal * coupon.value) / 100);
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, eligibleSubtotal);
    } else if (coupon.type === 'free_shipping') {
      discount = 0; // Free shipping is handled in shippingFee calculation
    }

    return {
      valid: true,
      coupon,
      discount
    };
  }

  /**
   * Find the best valid auto-apply coupon for the given cart subtotal
   */
  static async getAutoApplyCoupon(
    cartTotal: number,
    items?: CartItem[],
    options?: { isFirstTimeUser?: boolean; paymentMethod?: string }
  ): Promise<{ valid: boolean; coupon?: Coupon; discount: number; autoApplyTitle?: string } | null> {
    const allCoupons = await this.getAll();
    const autoApplyCoupons = allCoupons.filter(c => c.isActive && c.isAutoApply);

    if (autoApplyCoupons.length === 0) return null;

    let bestResult: { valid: boolean; coupon?: Coupon; discount: number; autoApplyTitle?: string } | null = null;

    for (const coupon of autoApplyCoupons) {
      const res = await this.validate(coupon.code, cartTotal, items, options);
      if (res.valid) {
        if (!bestResult || res.discount > bestResult.discount) {
          bestResult = {
            valid: true,
            coupon: res.coupon,
            discount: res.discount,
            autoApplyTitle: res.coupon?.autoApplyTitle || res.coupon?.description || 'Special Offer'
          };
        }
      }
    }

    return bestResult;
  }
}

