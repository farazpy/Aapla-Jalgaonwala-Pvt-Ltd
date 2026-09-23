import { BusinessPartner, PartnerOrderReferral, PartnerSettlement, PartnerDashboardStats, Order } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { CouponRepository } from './CouponRepository';
import { OrderRepository } from './OrderRepository';
import { isCorruptedQuestionMarks } from '../utils/transliterate';

const PARTNERS_FILE = 'business_partners.json';
const REFERRALS_FILE = 'partner_referrals.json';
const SETTLEMENTS_FILE = 'partner_settlements.json';

let partnerMemoryCache: { data: BusinessPartner[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000;
let isSyncing = false;

export class PartnerRepository {
  public static clearCache() {
    partnerMemoryCache = null;
  }

  // ----------------------------------------------------
  // AUTOMATIC ORDERS & REFERRAL SYNCHRONIZATION
  // ----------------------------------------------------
  static async syncAllPartnerReferrals(): Promise<void> {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const orders = await OrderRepository.getAll();
      const pool = getDbPool();
      let partners: BusinessPartner[] = [];

      if (pool) {
        try {
          const [rows] = await pool.query('SELECT * FROM business_partners ORDER BY created_at DESC');
          if (Array.isArray(rows) && rows.length > 0) {
            partners = (rows as any[]).map(this.mapDbToPartner);
          }
        } catch {}
      }

      if (partners.length === 0) {
        partners = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
      }

      if (partners.length === 0 || orders.length === 0) {
        isSyncing = false;
        return;
      }

      const existingReferrals = await this.getReferrals();
      const existingOrderIds = new Set(existingReferrals.map(r => r.orderId));
      const existingOrderNumbers = new Set(existingReferrals.map(r => r.orderNumber));

      for (const order of orders) {
        let code = (
          order.referralPartnerCode ||
          (order as any).partnerCode ||
          (order as any).referralCode ||
          ''
        ).trim().toUpperCase();

        if (!code && order.couponCode) {
          const cleanCoupon = order.couponCode.trim().toUpperCase();
          const matchedPartner = partners.find(
            p => p.partnerCode.toUpperCase() === cleanCoupon || cleanCoupon.startsWith(p.partnerCode.toUpperCase())
          );
          if (matchedPartner) {
            code = matchedPartner.partnerCode.toUpperCase();
          }
        }

        if (!code) continue;

        const partner = partners.find(p => p.partnerCode.toUpperCase() === code);
        if (!partner) continue;

        if (existingOrderIds.has(order.id) || existingOrderNumbers.has(order.orderNumber)) {
          continue;
        }

        await this.recordOrderReferral({
          partnerCode: partner.partnerCode,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderTotal: order.totalAmount,
          customerName: order.customer?.name || order.shippingAddress?.fullName || 'Customer',
          customerCity: order.shippingAddress?.city || partner.city
        });

        existingOrderIds.add(order.id);
        existingOrderNumbers.add(order.orderNumber);
      }

      await this.recalculateAllPartnerMetrics();
    } catch (err) {
      console.warn('[PartnerRepo] syncAllPartnerReferrals warning:', err);
    } finally {
      isSyncing = false;
    }
  }

  // ----------------------------------------------------
  // PARTNERS (CRUD & Queries)
  // ----------------------------------------------------

  static async getAll(): Promise<BusinessPartner[]> {
    await this.syncAllPartnerReferrals();

    if (partnerMemoryCache && (Date.now() - partnerMemoryCache.timestamp < CACHE_TTL_MS)) {
      return partnerMemoryCache.data;
    }

    const pool = getDbPool();
    let partners: BusinessPartner[] = [];

    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM business_partners ORDER BY created_at DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          partners = (rows as any[]).map(this.mapDbToPartner);
          partnerMemoryCache = { data: partners, timestamp: Date.now() };
          return partners;
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getAll failed:', err);
      }
    }

    partners = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
    partnerMemoryCache = { data: partners, timestamp: Date.now() };
    return partners;
  }

  static async getById(id: string): Promise<BusinessPartner | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM business_partners WHERE id = ? LIMIT 1', [id]);
        if (Array.isArray(rows) && rows.length > 0) {
          return this.mapDbToPartner(rows[0]);
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getById failed:', err);
      }
    }
    const all = await this.getAll();
    return all.find(p => p.id === id) || null;
  }

  static async getByCode(code: string): Promise<BusinessPartner | null> {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT * FROM business_partners WHERE UPPER(partner_code) = ? LIMIT 1',
          [cleanCode]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return this.mapDbToPartner(rows[0]);
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getByCode failed:', err);
      }
    }
    const all = await this.getAll();
    return all.find(p => p.partnerCode.toUpperCase() === cleanCode) || null;
  }

  static async isCodeExists(code: string): Promise<boolean> {
    if (!code) return false;
    const cleanCode = code.trim().toUpperCase();
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT id FROM business_partners WHERE UPPER(partner_code) = ? LIMIT 1',
          [cleanCode]
        );
        if (Array.isArray(rows) && rows.length > 0) return true;
      } catch (err) {
        console.warn('[PartnerRepo] MySQL isCodeExists failed, checking cache/JSON:', err);
      }
    }
    const all = await this.getAll();
    return all.some(p => p.partnerCode && p.partnerCode.toUpperCase() === cleanCode);
  }

  static async getByPhone(phone: string): Promise<BusinessPartner | null> {
    const cleanPhone = phone ? phone.trim().replace(/[^\d]/g, '') : '';
    if (!cleanPhone) return null;
    const last10 = cleanPhone.slice(-10);

    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT * FROM business_partners WHERE phone LIKE ? OR phone = ? LIMIT 1',
          [`%${last10}`, cleanPhone]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return this.mapDbToPartner(rows[0]);
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getByPhone failed, checking cache/JSON:', err);
      }
    }

    const all = await this.getAll();
    return all.find(p => {
      const pPhone = p.phone ? p.phone.replace(/[^\d]/g, '') : '';
      return pPhone === cleanPhone || (pPhone.length >= 10 && cleanPhone.length >= 10 && pPhone.slice(-10) === last10);
    }) || null;
  }

  static async getByEmail(email: string): Promise<BusinessPartner | null> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail) return null;

    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT * FROM business_partners WHERE LOWER(email) = ? LIMIT 1',
          [cleanEmail]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return this.mapDbToPartner(rows[0]);
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getByEmail failed, checking cache/JSON:', err);
      }
    }

    const all = await this.getAll();
    return all.find(p => p.email && p.email.trim().toLowerCase() === cleanEmail) || null;
  }

  static async checkDuplicates(email: string, phone: string): Promise<{
    exists: boolean;
    duplicateField?: 'email' | 'phone';
    message?: string;
    existingPartner?: BusinessPartner;
  }> {
    if (email) {
      const existingEmail = await this.getByEmail(email);
      if (existingEmail) {
        return {
          exists: true,
          duplicateField: 'email',
          message: `The email address "${email.trim()}" is already registered with Partner Code "${existingEmail.partnerCode}". Please log in with your credentials or use a different email.`,
          existingPartner: existingEmail
        };
      }
    }

    if (phone) {
      const existingPhone = await this.getByPhone(phone);
      if (existingPhone) {
        return {
          exists: true,
          duplicateField: 'phone',
          message: `The mobile number "${phone.trim()}" is already registered with Partner Code "${existingPhone.partnerCode}". Please log in with your credentials or use a different mobile number.`,
          existingPartner: existingPhone
        };
      }
    }

    return { exists: false };
  }

  static async getByPhoneOrEmail(phone: string, email: string): Promise<BusinessPartner | null> {
    const dup = await this.checkDuplicates(email, phone);
    if (dup.exists && dup.existingPartner) {
      return dup.existingPartner;
    }

    const cleanPhone = phone ? phone.trim().replace(/[^\d]/g, '') : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    const all = await this.getAll();
    return (
      all.find(p => {
        const pPhone = p.phone ? p.phone.replace(/[^\d]/g, '') : '';
        const pEmail = p.email ? p.email.toLowerCase() : '';
        return (cleanPhone && pPhone === cleanPhone) || (cleanEmail && pEmail === cleanEmail);
      }) || null
    );
  }

  static async generateUniquePartnerCode(partnerData?: Partial<BusinessPartner> | string): Promise<string> {
    let baseCode = '';
    if (typeof partnerData === 'string') {
      const cleanName = partnerData.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'PART';
      const randomDigits = Math.floor(100 + Math.random() * 900);
      baseCode = `AJW-${cleanName}${randomDigits}`;
    } else {
      const aadhaarDigits = (partnerData?.aadhaarPanNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 2) || '';
      const mobileDigits = (partnerData?.phone || '').replace(/[^\d]/g, '').slice(-4) || '';
      const nameDigits = (partnerData?.fullName || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'WBP';
      
      if (aadhaarDigits && mobileDigits) {
        baseCode = `AJW-${aadhaarDigits}${mobileDigits}`;
      } else if (nameDigits && mobileDigits) {
        baseCode = `AJW-${nameDigits}${mobileDigits}`;
      } else {
        baseCode = `AJW-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    let candidate = baseCode.toUpperCase();
    let collisionCount = 0;
    while (await this.isCodeExists(candidate)) {
      collisionCount++;
      const randomSalt = Math.floor(10 + Math.random() * 90);
      candidate = `${baseCode.slice(0, 8)}${randomSalt}`.toUpperCase();
      if (collisionCount > 20) {
        candidate = `AJW-${Date.now().toString().slice(-6)}`;
        break;
      }
    }
    return candidate;
  }

  static generatePartnerCode(partnerData?: Partial<BusinessPartner> | string): string {
    if (typeof partnerData === 'string') {
      const cleanName = partnerData.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'PART';
      const randomDigits = Math.floor(100 + Math.random() * 900);
      return `AJW-${cleanName}${randomDigits}`;
    }
    const aadhaarDigits = (partnerData?.aadhaarPanNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 2) || '99';
    const mobileDigits = (partnerData?.phone || '').replace(/[^\d]/g, '').slice(0, 4) || '7057';
    return `AJW-${aadhaarDigits}${mobileDigits}`;
  }

  static async create(partnerData: Partial<BusinessPartner>): Promise<BusinessPartner> {
    this.clearCache();
    const now = new Date().toISOString();
    const id = partnerData.id || `wbp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const partnerCode = partnerData.partnerCode ? partnerData.partnerCode.toUpperCase() : await this.generateUniquePartnerCode(partnerData);

    const newPartner: BusinessPartner = {
      id,
      partnerCode: partnerCode.toUpperCase(),
      fullName: partnerData.fullName || '',
      phone: partnerData.phone || '',
      email: partnerData.email || '',
      city: partnerData.city || '',
      state: partnerData.state || 'Maharashtra',
      socialPlatform: partnerData.socialPlatform || 'Instagram',
      socialHandle: partnerData.socialHandle || '',
      bankAccountName: partnerData.bankAccountName || partnerData.fullName || '',
      bankName: partnerData.bankName || '',
      bankAccountNumber: partnerData.bankAccountNumber || '',
      ifscCode: (partnerData.ifscCode || '').toUpperCase(),
      upiId: partnerData.upiId || '',
      aadhaarPanNumber: partnerData.aadhaarPanNumber || '',
      documentUrl: partnerData.documentUrl || '',
      status: partnerData.status || 'pending',
      paymentStatus: partnerData.paymentStatus || 'paid',
      paymentRef: partnerData.paymentRef || partnerData.transactionId || partnerData.razorpayPaymentId || undefined,
      transactionId: partnerData.transactionId || partnerData.razorpayPaymentId || partnerData.paymentRef || undefined,
      razorpayPaymentId: partnerData.razorpayPaymentId || partnerData.paymentRef || undefined,
      razorpayOrderId: partnerData.razorpayOrderId || undefined,
      paymentAmount: partnerData.paymentAmount !== undefined ? Number(partnerData.paymentAmount) : 699,
      paymentDate: partnerData.paymentDate || now,
      commissionRate: partnerData.commissionRate || 12.0,
      customerDiscountRate: partnerData.customerDiscountRate || 4.0,
      totalOrdersCount: partnerData.totalOrdersCount || 0,
      totalSalesAmount: partnerData.totalSalesAmount || 0,
      totalCommissionEarned: partnerData.totalCommissionEarned || 0,
      totalCommissionPaid: partnerData.totalCommissionPaid || 0,
      pendingCommission: partnerData.pendingCommission || 0,
      referredByPartnerCode: partnerData.referredByPartnerCode || undefined,
      referralBonusEarned: partnerData.referralBonusEarned || 0,
      notes: partnerData.notes || '',
      approvedAt: (partnerData.status === 'active' || partnerData.status === 'approved') ? (partnerData.approvedAt || now) : undefined,
      createdAt: partnerData.createdAt || now,
      updatedAt: now
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO business_partners (
            id, partner_code, full_name, phone, email, city, state,
            social_platform, social_handle, bank_account_name, bank_name,
            bank_account_number, ifsc_code, upi_id, aadhaar_pan_number,
            document_url, status, payment_status, payment_ref, transaction_id, razorpay_payment_id, razorpay_order_id, payment_amount, payment_date,
            commission_rate, customer_discount_rate,
            total_orders_count, total_sales_amount, total_commission_earned,
            total_commission_paid, pending_commission, referred_by_partner_code, referral_bonus_earned, notes, approved_at,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            full_name=VALUES(full_name), phone=VALUES(phone), email=VALUES(email),
            city=VALUES(city), state=VALUES(state), status=VALUES(status),
            payment_status=VALUES(payment_status), payment_ref=VALUES(payment_ref), transaction_id=VALUES(transaction_id),
            razorpay_payment_id=VALUES(razorpay_payment_id), razorpay_order_id=VALUES(razorpay_order_id),
            payment_amount=VALUES(payment_amount), payment_date=VALUES(payment_date),
            customer_discount_rate=VALUES(customer_discount_rate), updated_at=VALUES(updated_at)`,
          [
            newPartner.id,
            newPartner.partnerCode,
            newPartner.fullName,
            newPartner.phone,
            newPartner.email,
            newPartner.city,
            newPartner.state,
            newPartner.socialPlatform,
            newPartner.socialHandle,
            newPartner.bankAccountName,
            newPartner.bankName,
            newPartner.bankAccountNumber,
            newPartner.ifscCode,
            newPartner.upiId,
            newPartner.aadhaarPanNumber,
            newPartner.documentUrl,
            newPartner.status,
            newPartner.paymentStatus || 'paid',
            newPartner.paymentRef || null,
            newPartner.transactionId || newPartner.paymentRef || null,
            newPartner.razorpayPaymentId || newPartner.paymentRef || null,
            newPartner.razorpayOrderId || null,
            newPartner.paymentAmount || 0,
            newPartner.paymentDate ? new Date(newPartner.paymentDate) : null,
            newPartner.commissionRate,
            newPartner.customerDiscountRate,
            newPartner.totalOrdersCount,
            newPartner.totalSalesAmount,
            newPartner.totalCommissionEarned,
            newPartner.totalCommissionPaid,
            newPartner.pendingCommission,
            newPartner.referredByPartnerCode || null,
            newPartner.referralBonusEarned || 0,
            newPartner.notes,
            newPartner.approvedAt || null,
            newPartner.createdAt,
            newPartner.updatedAt
          ]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL insert failed, fallback to JSON:', err);
      }
    }

    // Always update JSON storage for persistence
    const all = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
    const existingIdx = all.findIndex(p => p.id === newPartner.id || p.partnerCode.toUpperCase() === newPartner.partnerCode.toUpperCase());
    if (existingIdx >= 0) {
      all[existingIdx] = newPartner;
    } else {
      all.unshift(newPartner);
    }
    await writeJson(PARTNERS_FILE, all);

    // Auto-create corresponding 4% coupon in CouponRepository (active only if approved)
    try {
      await CouponRepository.create({
        code: newPartner.partnerCode,
        description: `Women Business Partner (${newPartner.fullName}) 4% Referral Discount`,
        type: 'percentage',
        value: 4,
        isStoreWide: true,
        isActive: newPartner.status === 'active' || newPartner.status === 'approved'
      });
    } catch (couponErr) {
      console.warn('[PartnerRepo] Auto coupon creation warning:', couponErr);
    }

    return newPartner;
  }

  static async update(id: string, updates: Partial<BusinessPartner>): Promise<BusinessPartner | null> {
    this.clearCache();
    const existing = await this.getById(id);
    if (!existing) return null;

    const isNewlyApproved = (updates.status === 'active' || updates.status === 'approved') && (existing.status === 'pending' || existing.status === 'suspended');

    const updated: BusinessPartner = {
      ...existing,
      ...updates,
      paymentRef: updates.paymentRef || updates.transactionId || updates.razorpayPaymentId || existing.paymentRef || existing.transactionId,
      transactionId: updates.transactionId || updates.razorpayPaymentId || updates.paymentRef || existing.transactionId || existing.paymentRef,
      razorpayPaymentId: updates.razorpayPaymentId || updates.paymentRef || existing.razorpayPaymentId || existing.paymentRef,
      razorpayOrderId: updates.razorpayOrderId !== undefined ? updates.razorpayOrderId : existing.razorpayOrderId,
      approvedAt: isNewlyApproved ? (existing.approvedAt || new Date().toISOString()) : (updates.approvedAt !== undefined ? updates.approvedAt : existing.approvedAt),
      updatedAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE business_partners SET
            partner_code = ?, full_name = ?, phone = ?, email = ?,
            city = ?, state = ?, social_platform = ?, social_handle = ?,
            bank_account_name = ?, bank_name = ?, bank_account_number = ?,
            ifsc_code = ?, upi_id = ?, aadhaar_pan_number = ?, document_url = ?,
            status = ?, payment_status = ?, payment_ref = ?, transaction_id = ?, razorpay_payment_id = ?, razorpay_order_id = ?,
            payment_amount = ?, payment_date = ?,
            commission_rate = ?, customer_discount_rate = ?,
            total_orders_count = ?, total_sales_amount = ?, total_commission_earned = ?,
            total_commission_paid = ?, pending_commission = ?, referred_by_partner_code = ?,
            referral_bonus_earned = ?, notes = ?, approved_at = ?, updated_at = ?
          WHERE id = ?`,
          [
            updated.partnerCode,
            updated.fullName,
            updated.phone,
            updated.email,
            updated.city,
            updated.state,
            updated.socialPlatform,
            updated.socialHandle,
            updated.bankAccountName,
            updated.bankName,
            updated.bankAccountNumber,
            updated.ifscCode,
            updated.upiId,
            updated.aadhaarPanNumber,
            updated.documentUrl,
            updated.status,
            updated.paymentStatus || 'paid',
            updated.paymentRef || null,
            updated.transactionId || updated.paymentRef || null,
            updated.razorpayPaymentId || updated.paymentRef || null,
            updated.razorpayOrderId || null,
            updated.paymentAmount || 0,
            updated.paymentDate ? new Date(updated.paymentDate) : null,
            updated.commissionRate,
            updated.customerDiscountRate,
            updated.totalOrdersCount,
            updated.totalSalesAmount,
            updated.totalCommissionEarned,
            updated.totalCommissionPaid,
            updated.pendingCommission,
            updated.referredByPartnerCode || null,
            updated.referralBonusEarned || 0,
            updated.notes,
            updated.approvedAt || null,
            updated.updatedAt,
            updated.id
          ]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL update failed, fallback to JSON:', err);
      }
    }

    const all = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) {
      all[idx] = updated;
      await writeJson(PARTNERS_FILE, all);
    }

    // Synchronize coupon activation state
    try {
      if (updated.status === 'active' || updated.status === 'approved') {
        const existingCoupon = await CouponRepository.getByCode(updated.partnerCode);
        if (existingCoupon) {
          await CouponRepository.update(existingCoupon.id, { isActive: true });
        } else {
          await CouponRepository.create({
            code: updated.partnerCode,
            description: `Women Business Partner (${updated.fullName}) 4% Referral Discount`,
            type: 'percentage',
            value: 4,
            isStoreWide: true,
            isActive: true
          });
        }
      } else if (updated.status === 'suspended' || updated.status === 'pending') {
        const existingCoupon = await CouponRepository.getByCode(updated.partnerCode);
        if (existingCoupon) {
          await CouponRepository.update(existingCoupon.id, { isActive: false });
        }
      }
    } catch (err) {
      console.warn('[PartnerRepo] Coupon status sync warning:', err);
    }

    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    this.clearCache();
    const partner = await this.getById(id);
    if (partner?.partnerCode) {
      try {
        await CouponRepository.delete(partner.partnerCode);
      } catch (err) {
        console.warn(`[PartnerRepo] Failed to delete coupon for partner ${partner.partnerCode} on delete:`, err);
      }
    }

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM business_partners WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[PartnerRepo] MySQL delete failed:', err);
      }
    }
    const all = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
    const filtered = all.filter(p => p.id !== id);
    await writeJson(PARTNERS_FILE, filtered);
    return true;
  }

  static async bulkUpdateStatus(ids: string[], status: 'active' | 'suspended' | 'pending' | 'approved'): Promise<{ successCount: number }> {
    if (!ids || ids.length === 0) return { successCount: 0 };
    this.clearCache();

    const pool = getDbPool();
    if (pool) {
      try {
        const placeholders = ids.map(() => '?').join(',');
        await pool.query(
          `UPDATE business_partners SET status = ?, updated_at = ? WHERE id IN (${placeholders})`,
          [status, new Date().toISOString(), ...ids]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL bulkUpdateStatus failed:', err);
      }
    }

    const all = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
    const idSet = new Set(ids);
    let count = 0;
    const nowIso = new Date().toISOString();
    const updated = all.map(p => {
      if (idSet.has(p.id)) {
        count++;
        const isNewlyApproved = (status === 'active' || status === 'approved') && (p.status === 'pending' || p.status === 'suspended');
        return {
          ...p,
          status,
          approvedAt: isNewlyApproved ? (p.approvedAt || nowIso) : p.approvedAt,
          updatedAt: nowIso
        };
      }
      return p;
    });

    await writeJson(PARTNERS_FILE, updated);

    // Sync coupons for all updated partners
    for (const id of ids) {
      try {
        const p = updated.find(item => item.id === id);
        if (p?.partnerCode) {
          const isActive = status === 'active' || status === 'approved';
          const existingCoupon = await CouponRepository.getByCode(p.partnerCode);
          if (existingCoupon) {
            await CouponRepository.update(existingCoupon.id, { isActive });
          } else if (isActive) {
            await CouponRepository.create({
              code: p.partnerCode,
              description: `Women Business Partner (${p.fullName}) 4% Referral Discount`,
              type: 'percentage',
              value: 4,
              isStoreWide: true,
              isActive: true
            });
          }
        }
      } catch (couponErr) {
        console.warn(`[PartnerRepo] Bulk coupon sync warning for partner ${id}:`, couponErr);
      }
    }

    return { successCount: count || ids.length };
  }

  static async bulkDelete(ids: string[]): Promise<{ deletedCount: number }> {
    if (!ids || ids.length === 0) return { deletedCount: 0 };
    this.clearCache();

    // Fetch codes to delete their corresponding coupon codes
    const codesToDelete: string[] = [];
    for (const id of ids) {
      try {
        const p = await this.getById(id);
        if (p?.partnerCode) {
          codesToDelete.push(p.partnerCode);
        }
      } catch {}
    }

    const pool = getDbPool();
    if (pool) {
      try {
        const placeholders = ids.map(() => '?').join(',');
        await pool.query(`DELETE FROM business_partners WHERE id IN (${placeholders})`, ids);
      } catch (err) {
        console.warn('[PartnerRepo] MySQL bulkDelete failed:', err);
      }
    }

    const all = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
    const idSet = new Set(ids);
    const filtered = all.filter(p => !idSet.has(p.id));
    const deletedCount = all.length - filtered.length;
    await writeJson(PARTNERS_FILE, filtered);

    // Cascading coupon deletions
    for (const code of codesToDelete) {
      try {
        await CouponRepository.delete(code);
      } catch (err) {
        console.warn(`[PartnerRepo] Failed to delete coupon for bulk deleted partner ${code}:`, err);
      }
    }

    return { deletedCount: deletedCount || ids.length };
  }

  // ----------------------------------------------------
  // REFERRALS & ORDERS LINKING
  // ----------------------------------------------------

  static async getReferrals(partnerCode?: string): Promise<PartnerOrderReferral[]> {
    let rawReferrals: any[] = [];
    const pool = getDbPool();
    if (pool) {
      try {
        let query = 'SELECT * FROM partner_referrals ORDER BY created_at DESC';
        const params: any[] = [];
        if (partnerCode) {
          query = 'SELECT * FROM partner_referrals WHERE UPPER(partner_code) = ? ORDER BY created_at DESC';
          params.push(partnerCode.trim().toUpperCase());
        }
        const [rows] = await pool.query(query, params);
        if (Array.isArray(rows)) {
          rawReferrals = (rows as any[]).map(r => ({
            id: r.id,
            partnerId: r.partner_id,
            partnerCode: r.partner_code,
            partnerName: r.partner_name,
            orderId: r.order_id,
            orderNumber: r.order_number,
            orderDate: r.order_date,
            customerName: r.customer_name,
            customerCity: r.customer_city,
            orderTotal: Number(r.order_total || 0),
            customerDiscount: Number(r.customer_discount || 0),
            partnerCommission: Number(r.partner_commission || 0),
            status: r.status || 'on_hold',
            settlementId: r.settlement_id,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getReferrals failed:', err);
      }
    }

    if (rawReferrals.length === 0) {
      const all = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, this.getInitialReferrals());
      if (partnerCode) {
        rawReferrals = all.filter(r => r.partnerCode.toUpperCase() === partnerCode.trim().toUpperCase());
      } else {
        rawReferrals = all;
      }
    }

    // Cross-reference with OrderRepository to get authoritative live delivery and order status
    try {
      const [allOrders, allPartners] = await Promise.all([
        OrderRepository.getAll(),
        this.getAll().catch(() => [])
      ]);
      const orderMapById = new Map<string, any>();
      const orderMapByNumber = new Map<string, any>();
      for (const ord of allOrders) {
        if (ord.id) orderMapById.set(String(ord.id), ord);
        if (ord.orderNumber) orderMapByNumber.set(String(ord.orderNumber), ord);
      }
      const partnerByCode = new Map<string, BusinessPartner>();
      for (const p of allPartners) {
        if (p.partnerCode) partnerByCode.set(p.partnerCode.trim().toUpperCase(), p);
      }

      return rawReferrals.map((r: any) => {
        let partnerName = r.partnerName;
        if (!partnerName || isCorruptedQuestionMarks(partnerName)) {
          const matchedPartner = partnerByCode.get((r.partnerCode || '').trim().toUpperCase());
          if (matchedPartner && matchedPartner.fullName && !isCorruptedQuestionMarks(matchedPartner.fullName)) {
            partnerName = matchedPartner.fullName;
          }
        }

        const order = orderMapById.get(String(r.orderId)) || orderMapByNumber.get(String(r.orderNumber));
        const isWhatsAppOrCustom = String(r.orderId || '').toUpperCase().startsWith('WA') || String(r.orderNumber || '').toUpperCase().startsWith('WA') || String(r.id || '').startsWith('ref_wa_');
        const liveOrderStatus = order ? (order.status || 'Pending').trim() : (isWhatsAppOrCustom || r.status === 'eligible' || r.status === 'settled' ? 'Delivered' : (r.orderStatus || 'Pending').trim());
        const isDelivered = liveOrderStatus.toLowerCase() === 'delivered' || isWhatsAppOrCustom || r.status === 'eligible' || r.status === 'settled';
        const isCancelled = liveOrderStatus.toLowerCase() === 'cancelled';
        const isFullyPaid = order ? (String(order.paymentStatus || '').toLowerCase() === 'paid' || order.isPaid === true) : false;
        const isEligibleForCommission = !isCancelled && (isDelivered || isFullyPaid);

        let effectiveStatus = r.status;
        let commissionStatus: 'delivered' | 'on_hold' | 'settled' | 'cancelled' = 'on_hold';
        let holdReason: string | undefined = undefined;

        if (r.settlementId || r.status === 'settled') {
          effectiveStatus = 'settled';
          commissionStatus = 'settled';
        } else if (isEligibleForCommission) {
          effectiveStatus = 'eligible';
          commissionStatus = 'delivered';
        } else if (isCancelled) {
          effectiveStatus = 'cancelled';
          commissionStatus = 'cancelled';
          holdReason = 'Order Cancelled';
        } else {
          effectiveStatus = 'on_hold';
          commissionStatus = 'on_hold';
          holdReason = 'Order yet to be delivered or fully paid';
        }

        return {
          ...r,
          partnerName: partnerName || r.partnerName,
          status: effectiveStatus,
          orderStatus: liveOrderStatus,
          isDelivered: isEligibleForCommission,
          commissionStatus,
          holdReason
        };
      });
    } catch (err) {
      console.warn('[PartnerRepo] Error joining order status in getReferrals:', err);
      return rawReferrals;
    }
  }

  static async recalculatePartnerMetrics(partnerCode: string): Promise<BusinessPartner | null> {
    const partner = await this.getByCode(partnerCode);
    if (!partner) return null;

    const allPartnerRefs = await this.getReferrals(partner.partnerCode);
    const partnerSettlements = await this.getSettlements(partner.partnerCode);

    const newTotalOrders = allPartnerRefs.length;
    const newTotalSales = allPartnerRefs.reduce((sum, r) => sum + (r.orderTotal || 0), 0);

    // Orders marked DELIVERED or FULLY PAID earn commission!
    const eligibleRefs = allPartnerRefs.filter(r => (r.status === 'eligible' || r.status === 'settled' || r.isDelivered) && r.orderStatus?.toLowerCase() !== 'cancelled');
    const onHoldRefs = allPartnerRefs.filter(r => r.status === 'on_hold' && r.orderStatus?.toLowerCase() !== 'cancelled');

    const deliveredCommissionEarned = eligibleRefs.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
    const onHoldCommission = onHoldRefs.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
    const paidCommission = partnerSettlements.reduce((sum, s) => sum + (s.amount || 0), 0) || (partner.totalCommissionPaid || 0);
    const newPendingCommission = Math.max(0, Math.round((deliveredCommissionEarned - paidCommission) * 100) / 100);

    return await this.update(partner.id, {
      totalOrdersCount: newTotalOrders,
      totalSalesAmount: newTotalSales,
      totalCommissionEarned: deliveredCommissionEarned,
      totalCommissionPaid: paidCommission,
      pendingCommission: newPendingCommission,
      onHoldCommission: onHoldCommission,
      deliveredOrdersCount: eligibleRefs.length
    });
  }

  static async recalculateAllPartnerMetrics(): Promise<void> {
    try {
      const pool = getDbPool();
      let partners: BusinessPartner[] = [];
      if (pool) {
        try {
          const [rows] = await pool.query('SELECT * FROM business_partners ORDER BY created_at DESC');
          if (Array.isArray(rows) && rows.length > 0) {
            partners = (rows as any[]).map(this.mapDbToPartner);
          }
        } catch {}
      }
      if (partners.length === 0) {
        partners = await readJson<BusinessPartner[]>(PARTNERS_FILE, this.getInitialPartners());
      }
      if (partners.length === 0) return;

      const referrals = await this.getReferrals();
      const settlements = await this.getSettlements();

      const settlementsByCode = new Map<string, number>();
      for (const s of settlements) {
        const code = (s.partnerCode || '').trim().toUpperCase();
        settlementsByCode.set(code, (settlementsByCode.get(code) || 0) + (s.amount || 0));
      }

      const refsByCode = new Map<string, PartnerOrderReferral[]>();
      for (const r of referrals) {
        const code = (r.partnerCode || '').trim().toUpperCase();
        if (!refsByCode.has(code)) refsByCode.set(code, []);
        refsByCode.get(code)!.push(r);
      }

      const updatePromises: Promise<any>[] = [];

      for (const p of partners) {
        const code = (p.partnerCode || '').trim().toUpperCase();
        const refs = refsByCode.get(code) || [];
        const totalOrders = refs.length;
        const totalSales = refs.reduce((sum, r) => sum + (r.orderTotal || 0), 0);

        const eligibleRefs = refs.filter(r => (r.status === 'eligible' || r.status === 'settled' || r.isDelivered) && r.status !== 'cancelled');
        const onHoldRefs = refs.filter(r => r.status === 'on_hold' && r.status !== 'cancelled');

        const commissionEarned = eligibleRefs.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
        const onHoldComm = onHoldRefs.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
        const commissionPaid = settlementsByCode.get(code) ?? (p.totalCommissionPaid || 0);
        const pendingComm = Math.max(0, Math.round((commissionEarned - commissionPaid) * 100) / 100);

        const hasChanged = 
          p.totalOrdersCount !== totalOrders ||
          p.totalSalesAmount !== totalSales ||
          p.totalCommissionEarned !== commissionEarned ||
          p.totalCommissionPaid !== commissionPaid ||
          p.pendingCommission !== pendingComm ||
          p.deliveredOrdersCount !== eligibleRefs.length;

        p.totalOrdersCount = totalOrders;
        p.totalSalesAmount = totalSales;
        p.totalCommissionEarned = commissionEarned;
        p.totalCommissionPaid = commissionPaid;
        p.pendingCommission = pendingComm;
        p.onHoldCommission = onHoldComm;
        p.deliveredOrdersCount = eligibleRefs.length;

        if (pool && hasChanged) {
          updatePromises.push(
            pool.query(
              `UPDATE business_partners 
               SET total_orders_count = ?, total_sales_amount = ?, total_commission_earned = ?, total_commission_paid = ?, pending_commission = ?, updated_at = NOW() 
               WHERE id = ?`,
              [totalOrders, totalSales, commissionEarned, commissionPaid, pendingComm, p.id]
            ).catch(err => {
              console.warn('[PartnerRepo] Error updating partner metrics in MySQL:', err);
            })
          );
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      await writeJson(PARTNERS_FILE, partners);
      partnerMemoryCache = { data: partners, timestamp: Date.now() };
    } catch (err) {
      console.warn('[PartnerRepo] recalculateAllPartnerMetrics error:', err);
    }
  }

  static async syncOrderStatusToReferral(orderIdOrNumber: string, newStatus?: string, newPaymentStatus?: string): Promise<void> {
    if (!orderIdOrNumber) return;
    try {
      const order = await OrderRepository.getById(orderIdOrNumber) || await OrderRepository.getByOrderNumber(orderIdOrNumber);
      const effectiveStatus = (newStatus || order?.status || 'Pending').trim();
      const effectivePayment = (newPaymentStatus || order?.paymentStatus || '').trim();

      const isDelivered = effectiveStatus.toLowerCase() === 'delivered';
      const isCancelled = effectiveStatus.toLowerCase() === 'cancelled';
      const isFullyPaid = effectivePayment.toLowerCase() === 'paid' || order?.isPaid === true;
      const isEligible = !isCancelled && (isDelivered || isFullyPaid);

      let newReferralStatus = 'on_hold';
      if (isEligible) newReferralStatus = 'eligible';
      else if (isCancelled) newReferralStatus = 'cancelled';

      // Update MySQL if connected
      const pool = getDbPool();
      if (pool) {
        try {
          await pool.query(
            `UPDATE partner_referrals 
             SET status = IF(settlement_id IS NOT NULL, 'settled', ?) 
             WHERE order_id = ? OR order_number = ?`,
            [newReferralStatus, String(orderIdOrNumber), String(orderIdOrNumber)]
          );
        } catch (err) {
          console.warn('[PartnerRepo] syncOrderStatusToReferral MySQL error:', err);
        }
      }

      // Update JSON storage
      const all = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, []);
      let affectedPartnerCode: string | null = null;
      let modified = false;

      for (const r of all) {
        if (r.orderId === orderIdOrNumber || r.orderNumber === orderIdOrNumber) {
          affectedPartnerCode = r.partnerCode;
          if (!r.settlementId) {
            r.status = newReferralStatus as any;
            r.orderStatus = effectiveStatus;
            r.isDelivered = isEligible;
            r.commissionStatus = isEligible ? 'delivered' : (isCancelled ? 'cancelled' : 'on_hold');
            r.holdReason = isEligible ? undefined : (isCancelled ? 'Order Cancelled' : 'Order yet to be delivered or fully paid');
            modified = true;
          }
        }
      }

      if (modified) {
        await writeJson(REFERRALS_FILE, all);
      }

      if (affectedPartnerCode) {
        await this.recalculatePartnerMetrics(affectedPartnerCode);
      }
    } catch (err) {
      console.warn('[PartnerRepo] syncOrderStatusToReferral error:', err);
    }
  }

  static async recordOrderReferral(params: {
    partnerCode: string;
    orderId: string;
    orderNumber: string;
    orderTotal: number;
    customerName: string;
    customerCity?: string;
  }): Promise<PartnerOrderReferral | null> {
    const partner = await this.getByCode(params.partnerCode);
    if (!partner) return null;

    // Check if referral for this order already recorded
    const existingReferrals = await this.getReferrals(partner.partnerCode);
    const alreadyExists = existingReferrals.find(
      r => r.orderId === params.orderId || r.orderNumber === params.orderNumber
    );
    if (alreadyExists) {
      return alreadyExists;
    }

    const commissionRate = partner.commissionRate || 12;
    const discountRate = partner.customerDiscountRate || 4;
    const commissionAmount = Math.round((params.orderTotal * (commissionRate / 100)) * 100) / 100;
    const discountAmount = Math.round((params.orderTotal * (discountRate / 100)) * 100) / 100;

    // Initially check if order is already delivered or fully paid
    let initialStatus: 'eligible' | 'on_hold' = 'on_hold';
    let isDeliveredOrPaid = false;
    let initialHoldReason: string | undefined = 'Order yet to be delivered or fully paid';

    try {
      const order = await OrderRepository.getById(params.orderId) || await OrderRepository.getByOrderNumber(params.orderNumber);
      if (order) {
        const isDelivered = order.status?.toLowerCase() === 'delivered';
        const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid' || order.isPaid === true;
        const isCancelled = order.status?.toLowerCase() === 'cancelled';
        if (!isCancelled && (isDelivered || isPaid)) {
          initialStatus = 'eligible';
          isDeliveredOrPaid = true;
          initialHoldReason = undefined;
        }
      }
    } catch {}

    const referral: PartnerOrderReferral = {
      id: `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partnerId: partner.id,
      partnerCode: partner.partnerCode,
      partnerName: partner.fullName,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      orderDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      customerName: params.customerName,
      customerCity: params.customerCity || partner.city,
      orderTotal: params.orderTotal,
      customerDiscount: discountAmount,
      partnerCommission: commissionAmount,
      status: initialStatus,
      orderStatus: 'Pending',
      isDelivered: isDeliveredOrPaid,
      commissionStatus: initialStatus === 'eligible' ? 'delivered' : 'on_hold',
      holdReason: initialHoldReason,
      createdAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO partner_referrals (
            id, partner_id, partner_code, partner_name, order_id, order_number,
            order_date, customer_name, customer_city, order_total,
            customer_discount, partner_commission, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE order_total=VALUES(order_total)`,
          [
            referral.id,
            referral.partnerId,
            referral.partnerCode,
            referral.partnerName,
            referral.orderId,
            referral.orderNumber,
            referral.orderDate,
            referral.customerName,
            referral.customerCity,
            referral.orderTotal,
            referral.customerDiscount,
            referral.partnerCommission,
            referral.status,
            referral.createdAt
          ]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL insert referral failed:', err);
      }
    }

    // Save JSON fallback
    const all = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, this.getInitialReferrals());
    const refIdx = all.findIndex(r => r.orderId === referral.orderId || r.orderNumber === referral.orderNumber);
    if (refIdx >= 0) {
      all[refIdx] = referral;
    } else {
      all.unshift(referral);
    }
    await writeJson(REFERRALS_FILE, all);

    // Calculate all referrals for this partner (only delivered earns commission)
    await this.recalculatePartnerMetrics(partner.partnerCode);

    return referral;
  }

  // ----------------------------------------------------
  // CUSTOM FUND / WHATSAPP ORDER COMMISSION
  // ----------------------------------------------------
  static async addCustomFund(params: {
    partnerId?: string;
    partnerCode?: string;
    amount: number; // in Rupees
    orderNumber?: string;
    orderTotal?: number;
    customerName?: string;
    customerCity?: string;
    notes?: string;
    markAsPaid?: boolean;
    paymentMethod?: string;
    transactionReference?: string;
    sendEmail?: boolean;
  }): Promise<{ referral: PartnerOrderReferral; partner: BusinessPartner; settlement?: PartnerSettlement }> {
    let partner: BusinessPartner | null = null;
    if (params.partnerId) {
      partner = await this.getById(params.partnerId);
    }
    if (!partner && params.partnerCode) {
      partner = await this.getByCode(params.partnerCode);
    }
    if (!partner) {
      throw new Error('Woman Business Partner not found');
    }

    const commissionAmount = Number(params.amount);
    if (isNaN(commissionAmount) || commissionAmount <= 0) {
      throw new Error('Valid commission amount in Rupees is required');
    }

    const orderTotal = Number(params.orderTotal || 0);
    const orderRef = (params.orderNumber || '').trim() || `WA-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const nowIso = now.toISOString();

    const referral: PartnerOrderReferral = {
      id: `ref_wa_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partnerId: partner.id,
      partnerCode: partner.partnerCode,
      partnerName: partner.fullName,
      orderId: orderRef,
      orderNumber: orderRef,
      orderDate: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      customerName: (params.customerName || '').trim() || 'WhatsApp Customer',
      customerCity: (params.customerCity || '').trim() || partner.city,
      orderTotal: orderTotal,
      customerDiscount: 0,
      partnerCommission: commissionAmount,
      status: params.markAsPaid ? 'settled' : 'eligible',
      orderStatus: 'Delivered',
      isDelivered: true,
      commissionStatus: params.markAsPaid ? 'settled' : 'delivered',
      holdReason: undefined,
      createdAt: nowIso
    };

    // Insert into MySQL
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO partner_referrals (
            id, partner_id, partner_code, partner_name, order_id, order_number,
            order_date, customer_name, customer_city, order_total,
            customer_discount, partner_commission, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            referral.id,
            referral.partnerId,
            referral.partnerCode,
            referral.partnerName,
            referral.orderId,
            referral.orderNumber,
            referral.orderDate,
            referral.customerName,
            referral.customerCity,
            referral.orderTotal,
            referral.customerDiscount,
            referral.partnerCommission,
            referral.status,
            referral.createdAt
          ]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL insert custom referral failed:', err);
      }
    }

    // Insert into JSON
    const allRefs = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, this.getInitialReferrals());
    allRefs.unshift(referral);
    await writeJson(REFERRALS_FILE, allRefs);

    let createdSettlement: PartnerSettlement | undefined = undefined;
    if (params.markAsPaid) {
      createdSettlement = await this.createSettlement({
        partnerId: partner.id,
        partnerCode: partner.partnerCode,
        partnerName: partner.fullName,
        amount: commissionAmount,
        paymentMethod: (params.paymentMethod as any) || 'UPI',
        transactionReference: params.transactionReference || `TXN-WA-${Date.now().toString().slice(-6)}`,
        notes: `Instant payout for WhatsApp Order ${orderRef}: ${params.notes || ''}`
      });
    }

    // Recalculate metrics for partner
    await this.recalculatePartnerMetrics(partner.partnerCode);
    const updatedPartner = (await this.getById(partner.id)) || partner;

    // Send email notification to the woman partner
    if (params.sendEmail !== false && updatedPartner.email) {
      import('../utils/mailer').then(({ sendPartnerWhatsAppCommissionEmail }) => {
        sendPartnerWhatsAppCommissionEmail(updatedPartner, {
          amount: commissionAmount,
          orderNumber: orderRef,
          orderTotal: orderTotal,
          customerName: referral.customerName,
          customerCity: referral.customerCity,
          notes: params.notes,
          markAsPaid: params.markAsPaid,
          paymentMethod: params.paymentMethod || 'UPI',
          newPendingCommission: updatedPartner.pendingCommission || 0
        }).catch(err => {
          console.error('[PartnerRepo] Failed to dispatch WhatsApp commission email:', err);
        });
      }).catch(err => {
        console.error('[PartnerRepo] Error dynamically importing mailer for WhatsApp commission email:', err);
      });
    }

    return {
      referral,
      partner: updatedPartner,
      settlement: createdSettlement
    };
  }

  // ----------------------------------------------------
  // DELETE REFERRAL / WHATSAPP MANUAL FUND ORDER
  // ----------------------------------------------------
  static async deleteReferral(
    referralIdOrOrderRef: string,
    options?: { deleteLinkedSettlement?: boolean }
  ): Promise<{
    success: boolean;
    partner?: BusinessPartner;
    deletedReferral?: PartnerOrderReferral;
    message?: string;
  }> {
    const cleanId = String(referralIdOrOrderRef || '').trim();
    if (!cleanId) {
      return { success: false, message: 'Invalid referral ID or order reference' };
    }

    const pool = getDbPool();
    let targetRef: PartnerOrderReferral | null = null;

    // 1. Locate referral in MySQL
    if (pool) {
      try {
        const [rows] = await pool.query(
          'SELECT * FROM partner_referrals WHERE id = ? OR order_id = ? OR order_number = ? LIMIT 1',
          [cleanId, cleanId, cleanId]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const r: any = rows[0];
          targetRef = {
            id: r.id,
            partnerId: r.partner_id,
            partnerCode: r.partner_code,
            partnerName: r.partner_name,
            orderId: r.order_id,
            orderNumber: r.order_number,
            orderDate: r.order_date,
            customerName: r.customer_name,
            customerCity: r.customer_city,
            orderTotal: Number(r.order_total || 0),
            customerDiscount: Number(r.customer_discount || 0),
            partnerCommission: Number(r.partner_commission || 0),
            status: r.status || 'eligible',
            settlementId: r.settlement_id,
            createdAt: r.created_at
          };
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL find referral for delete warning:', err);
      }
    }

    // 2. Fallback / check JSON file
    const allRefs = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, this.getInitialReferrals());
    const jsonMatch = allRefs.find(
      r => r.id === cleanId || r.orderId === cleanId || r.orderNumber === cleanId
    );
    if (!targetRef && jsonMatch) {
      targetRef = jsonMatch;
    }

    if (!targetRef) {
      return { success: false, message: `Referral order "${cleanId}" not found in records.` };
    }

    // 3. Delete from MySQL
    if (pool) {
      try {
        await pool.query(
          'DELETE FROM partner_referrals WHERE id = ? OR order_id = ? OR order_number = ?',
          [targetRef.id, targetRef.orderId, targetRef.orderNumber]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL delete referral failed:', err);
      }
    }

    // 4. Delete from JSON
    const filteredRefs = allRefs.filter(
      r => r.id !== targetRef!.id && r.orderId !== targetRef!.orderId && r.orderNumber !== targetRef!.orderNumber
    );
    await writeJson(REFERRALS_FILE, filteredRefs);

    // 5. Optional / automatic handling of linked settlement if marked as paid
    if (targetRef.settlementId || options?.deleteLinkedSettlement) {
      if (pool) {
        try {
          if (targetRef.settlementId) {
            await pool.query('DELETE FROM partner_settlements WHERE id = ?', [targetRef.settlementId]);
          }
          if (targetRef.orderNumber) {
            await pool.query('DELETE FROM partner_settlements WHERE notes LIKE ?', [`%${targetRef.orderNumber}%`]);
          }
        } catch (err) {
          console.warn('[PartnerRepo] MySQL delete linked settlement failed:', err);
        }
      }

      const settlements = await readJson<PartnerSettlement[]>(SETTLEMENTS_FILE, this.getInitialSettlements());
      const filteredSettlements = settlements.filter(
        s => s.id !== targetRef!.settlementId && (!targetRef!.orderNumber || !s.notes?.includes(targetRef!.orderNumber))
      );
      await writeJson(SETTLEMENTS_FILE, filteredSettlements);
    }

    // 6. Recalculate metrics for the woman partner
    let updatedPartner: BusinessPartner | null = null;
    if (targetRef.partnerCode) {
      const remainingSettlements = await this.getSettlements(targetRef.partnerCode);
      const totalCommissionPaid = remainingSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);
      const p = await this.getByCode(targetRef.partnerCode);
      if (p) {
        await this.update(p.id, { totalCommissionPaid });
      }
      updatedPartner = await this.recalculatePartnerMetrics(targetRef.partnerCode);
    }

    this.clearCache();

    return {
      success: true,
      partner: updatedPartner || undefined,
      deletedReferral: targetRef,
      message: `WhatsApp order #${targetRef.orderNumber} deleted successfully. Partner balance updated.`
    };
  }

  // ----------------------------------------------------
  // BULK DELETE PARTNER REFERRAL ORDERS
  // ----------------------------------------------------
  static async bulkDeleteReferrals(
    referralIdsOrRefs: string[],
    options?: { partnerCode?: string; deleteLinkedSettlements?: boolean }
  ): Promise<{
    success: boolean;
    deletedCount: number;
    deletedReferrals: PartnerOrderReferral[];
    partner?: BusinessPartner;
    message: string;
  }> {
    if (!referralIdsOrRefs || referralIdsOrRefs.length === 0) {
      return { success: false, deletedCount: 0, deletedReferrals: [], message: 'No referral IDs provided' };
    }

    const cleanIds = Array.from(new Set(referralIdsOrRefs.map(id => String(id || '').trim()).filter(Boolean)));
    if (cleanIds.length === 0) {
      return { success: false, deletedCount: 0, deletedReferrals: [], message: 'No valid referral IDs provided' };
    }

    const pool = getDbPool();
    const allRefs = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, this.getInitialReferrals());

    const targetMap = new Map<string, PartnerOrderReferral>();
    for (const r of allRefs) {
      if (cleanIds.includes(r.id) || (r.orderId && cleanIds.includes(r.orderId)) || (r.orderNumber && cleanIds.includes(r.orderNumber))) {
        targetMap.set(r.id, r);
      }
    }

    if (pool) {
      try {
        const placeholders = cleanIds.map(() => '?').join(',');
        const [rows] = await pool.query(
          `SELECT * FROM partner_referrals WHERE id IN (${placeholders}) OR order_id IN (${placeholders}) OR order_number IN (${placeholders})`,
          [...cleanIds, ...cleanIds, ...cleanIds]
        );
        if (Array.isArray(rows)) {
          for (const r of rows as any[]) {
            if (!targetMap.has(r.id)) {
              targetMap.set(r.id, {
                id: r.id,
                partnerId: r.partner_id,
                partnerCode: r.partner_code,
                partnerName: r.partner_name,
                orderId: r.order_id,
                orderNumber: r.order_number,
                orderDate: r.order_date,
                customerName: r.customer_name,
                customerCity: r.customer_city,
                orderTotal: Number(r.order_total || 0),
                customerDiscount: Number(r.customer_discount || 0),
                partnerCommission: Number(r.partner_commission || 0),
                status: r.status || 'eligible',
                settlementId: r.settlement_id,
                createdAt: r.created_at
              });
            }
          }
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL bulk find referrals warning:', err);
      }
    }

    const targets = Array.from(targetMap.values());
    if (targets.length === 0) {
      return { success: false, deletedCount: 0, deletedReferrals: [], message: 'None of the specified orders were found in records.' };
    }

    const targetIds = new Set(targets.map(t => t.id));
    const targetOrderIds = new Set(targets.map(t => t.orderId).filter(Boolean) as string[]);
    const targetOrderNumbers = new Set(targets.map(t => t.orderNumber).filter(Boolean) as string[]);
    const targetSettlementIds = new Set(targets.map(t => t.settlementId).filter(Boolean) as string[]);
    const affectedPartnerCodes = new Set<string>();
    if (options?.partnerCode) affectedPartnerCodes.add(options.partnerCode.trim().toUpperCase());
    for (const t of targets) {
      if (t.partnerCode) affectedPartnerCodes.add(t.partnerCode.trim().toUpperCase());
    }

    // 1. Delete from MySQL
    if (pool) {
      try {
        const idList = Array.from(targetIds);
        const p1 = idList.map(() => '?').join(',');
        await pool.query(`DELETE FROM partner_referrals WHERE id IN (${p1})`, idList);
      } catch (err) {
        console.warn('[PartnerRepo] MySQL bulk delete referrals failed:', err);
      }
    }

    // 2. Delete from JSON
    const remainingRefs = allRefs.filter(
      r => !targetIds.has(r.id) &&
           !(r.orderId && targetOrderIds.has(r.orderId)) &&
           !(r.orderNumber && targetOrderNumbers.has(r.orderNumber))
    );
    await writeJson(REFERRALS_FILE, remainingRefs);

    // 3. Delete linked settlements if requested
    const shouldDeleteSettlements = options?.deleteLinkedSettlements !== false;
    if (shouldDeleteSettlements && (targetSettlementIds.size > 0 || targetOrderNumbers.size > 0)) {
      if (pool) {
        try {
          if (targetSettlementIds.size > 0) {
            const sList = Array.from(targetSettlementIds);
            const p = sList.map(() => '?').join(',');
            await pool.query(`DELETE FROM partner_settlements WHERE id IN (${p})`, sList);
          }
          for (const onum of targetOrderNumbers) {
            await pool.query('DELETE FROM partner_settlements WHERE notes LIKE ?', [`%${onum}%`]);
          }
        } catch (err) {
          console.warn('[PartnerRepo] MySQL bulk delete settlements failed:', err);
        }
      }

      const settlements = await readJson<PartnerSettlement[]>(SETTLEMENTS_FILE, this.getInitialSettlements());
      const remainingSettlements = settlements.filter(s => {
        if (targetSettlementIds.has(s.id)) return false;
        if (s.notes) {
          for (const onum of targetOrderNumbers) {
            if (s.notes.includes(onum)) return false;
          }
        }
        return true;
      });
      await writeJson(SETTLEMENTS_FILE, remainingSettlements);
    }

    // 4. Recalculate metrics for all affected partners
    let updatedTargetPartner: BusinessPartner | null = null;
    for (const code of affectedPartnerCodes) {
      const remainingPartnerSettlements = await this.getSettlements(code);
      const totalCommissionPaid = remainingPartnerSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);
      const p = await this.getByCode(code);
      if (p) {
        await this.update(p.id, { totalCommissionPaid });
      }
      const updated = await this.recalculatePartnerMetrics(code);
      if (options?.partnerCode && code.toUpperCase() === options.partnerCode.toUpperCase()) {
        updatedTargetPartner = updated;
      } else if (!updatedTargetPartner) {
        updatedTargetPartner = updated;
      }
    }

    this.clearCache();

    return {
      success: true,
      deletedCount: targets.length,
      deletedReferrals: targets,
      partner: updatedTargetPartner || undefined,
      message: `Successfully deleted ${targets.length} order(s). Partner balance updated.`
    };
  }

  // ----------------------------------------------------
  // TRANSFER ORDER REFERRAL & COMMISSION
  // ----------------------------------------------------
  static async transferOrderReferral(params: {
    orderIdOrNumber: string;
    targetPartnerCode: string;
    commissionAmount?: number;
    reason?: string;
    notifyPartner?: boolean;
  }): Promise<{
    order: Order;
    previousPartner: BusinessPartner | null;
    targetPartner: BusinessPartner;
    referral: PartnerOrderReferral;
    commissionAmount: number;
    message: string;
  }> {
    const pool = getDbPool();
    const orderId = String(params.orderIdOrNumber || '').trim();
    if (!orderId) {
      throw new Error('Order ID or Number is required');
    }
    const cleanTargetCode = String(params.targetPartnerCode || '').trim().toUpperCase();
    if (!cleanTargetCode) {
      throw new Error('Target Woman Partner code is required');
    }

    // 1. Fetch order
    let order = await OrderRepository.getById(orderId);
    if (!order) {
      const allOrders = await OrderRepository.getAll();
      order = allOrders.find(o => o.id === orderId || o.orderNumber === orderId) || null;
    }
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // 2. Fetch target partner
    const targetPartner = await this.getByCode(cleanTargetCode);
    if (!targetPartner) {
      throw new Error(`Target Woman Business Partner with code ${cleanTargetCode} not found`);
    }

    // 3. Identify previous partner (if any)
    const prevCode = (order.referralPartnerCode || '').trim().toUpperCase();
    let previousPartner: BusinessPartner | null = null;
    if (prevCode) {
      previousPartner = await this.getByCode(prevCode);
    }

    // 4. Calculate commission
    let finalCommission = 0;
    if (params.commissionAmount !== undefined && !isNaN(Number(params.commissionAmount)) && Number(params.commissionAmount) >= 0) {
      finalCommission = Math.round(Number(params.commissionAmount) * 100) / 100;
    } else {
      const rate = targetPartner.commissionRate || 12;
      finalCommission = Math.round((Number(order.totalAmount || 0) * (rate / 100)) * 100) / 100;
    }

    // 5. Update Order record
    const dateStamp = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const prevDesc = previousPartner ? `${previousPartner.fullName} (${previousPartner.partnerCode})` : (prevCode || 'Direct/None');
    const transferNote = `[${dateStamp}] Woman Referral transferred to ${targetPartner.fullName} (${targetPartner.partnerCode}) from ${prevDesc}. Commission: ₹${finalCommission}.${params.reason ? ` Reason: ${params.reason}` : ''}`;
    const updatedNotes = order.notes ? `${order.notes}\n${transferNote}` : transferNote;

    const updatedOrder = (await OrderRepository.update(order.id, {
      referralPartnerCode: targetPartner.partnerCode,
      notes: updatedNotes
    })) || {
      ...order,
      referralPartnerCode: targetPartner.partnerCode,
      notes: updatedNotes
    };

    // 6. Update or Create referral record in storage
    const allReferrals = await this.getReferrals();
    let existingRef = allReferrals.find(
      r => r.orderId === order!.id || r.orderNumber === order!.orderNumber || r.orderId === order!.orderNumber || r.orderNumber === order!.id
    );

    const isDelivered = (order.status || '').toLowerCase() === 'delivered';
    const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
    let referral: PartnerOrderReferral;

    if (existingRef) {
      existingRef.partnerId = targetPartner.id;
      existingRef.partnerCode = targetPartner.partnerCode;
      existingRef.partnerName = targetPartner.fullName;
      existingRef.partnerCommission = finalCommission;
      existingRef.orderTotal = Number(order.totalAmount || existingRef.orderTotal);
      existingRef.customerCity = order.shippingAddress?.city || targetPartner.city;
      referral = existingRef;

      // Update MySQL if connected
      if (pool) {
        try {
          await pool.query(
            `UPDATE partner_referrals 
             SET partner_id = ?, partner_code = ?, partner_name = ?, partner_commission = ?, order_total = ?
             WHERE id = ? OR order_id = ? OR order_number = ?`,
            [targetPartner.id, targetPartner.partnerCode, targetPartner.fullName, finalCommission, referral.orderTotal, existingRef.id, order.id, order.orderNumber]
          );
        } catch (err) {
          console.warn('[PartnerRepo] MySQL update partner_referrals error:', err);
        }
      }

      // Update JSON files
      try {
        const refs = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, []);
        const idx = refs.findIndex(r => r.id === existingRef!.id || r.orderId === order!.id || r.orderNumber === order!.orderNumber);
        if (idx !== -1) {
          refs[idx] = { ...refs[idx], ...existingRef };
          await writeJson(REFERRALS_FILE, refs);
        }
      } catch (err) {
        console.warn('[PartnerRepo] JSON update error:', err);
      }
    } else {
      // Create new referral entry
      referral = {
        id: `ref_trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        partnerId: targetPartner.id,
        partnerCode: targetPartner.partnerCode,
        partnerName: targetPartner.fullName,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        customerName: order.customer?.name || order.shippingAddress?.fullName || 'Customer',
        customerCity: order.shippingAddress?.city || targetPartner.city,
        orderTotal: Number(order.totalAmount || 0),
        customerDiscount: Number(order.discount || 0),
        partnerCommission: finalCommission,
        status: isDelivered ? 'eligible' : (isCancelled ? 'cancelled' : 'on_hold'),
        orderStatus: order.status || 'Pending',
        isDelivered,
        commissionStatus: isDelivered ? 'delivered' : (isCancelled ? 'cancelled' : 'on_hold'),
        holdReason: isDelivered ? undefined : (isCancelled ? 'Order Cancelled' : 'Order yet to be delivered'),
        createdAt: new Date().toISOString()
      };

      if (pool) {
        try {
          await pool.query(
            `INSERT INTO partner_referrals (
              id, partner_id, partner_code, partner_name, order_id, order_number,
              order_date, customer_name, customer_city, order_total,
              customer_discount, partner_commission, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              referral.id,
              referral.partnerId,
              referral.partnerCode,
              referral.partnerName,
              referral.orderId,
              referral.orderNumber,
              referral.orderDate,
              referral.customerName,
              referral.customerCity,
              referral.orderTotal,
              referral.customerDiscount,
              referral.partnerCommission,
              referral.status,
              referral.createdAt
            ]
          );
        } catch (err) {
          console.warn('[PartnerRepo] MySQL insert new referral error:', err);
        }
      }

      try {
        const refs = await readJson<PartnerOrderReferral[]>(REFERRALS_FILE, []);
        refs.unshift(referral);
        await writeJson(REFERRALS_FILE, refs);
      } catch (err) {
        console.warn('[PartnerRepo] JSON insert error:', err);
      }
    }

    // 7. Clear caches & Recalculate metrics for both partners
    this.clearCache();
    OrderRepository.clearCache();

    if (previousPartner && previousPartner.partnerCode.toUpperCase() !== targetPartner.partnerCode.toUpperCase()) {
      await this.recalculatePartnerMetrics(previousPartner.partnerCode);
    }
    const updatedTarget = (await this.recalculatePartnerMetrics(targetPartner.partnerCode)) || targetPartner;
    const updatedPrev = previousPartner ? await this.getByCode(previousPartner.partnerCode) : null;

    // 8. Optional email notification to target partner
    if (params.notifyPartner !== false && targetPartner.email) {
      import('../utils/mailer').then(({ sendPartnerOrderTransferredEmail }) => {
        sendPartnerOrderTransferredEmail(targetPartner, {
          orderNumber: order!.orderNumber,
          customerName: referral.customerName,
          customerCity: referral.customerCity,
          orderTotal: Number(order!.totalAmount || 0),
          commissionAmount: finalCommission,
          newPendingCommission: updatedTarget.pendingCommission || 0,
          reason: params.reason
        }).catch(err => {
          console.error('[PartnerRepo] Failed to dispatch order transferred email:', err);
        });
      }).catch(err => {
        console.error('[PartnerRepo] Error dynamically importing mailer for order transferred email:', err);
      });
    }

    return {
      order: updatedOrder,
      previousPartner: updatedPrev,
      targetPartner: updatedTarget,
      referral,
      commissionAmount: finalCommission,
      message: `Successfully transferred Order #${order.orderNumber} and ₹${finalCommission} commission to ${targetPartner.fullName} (${targetPartner.partnerCode}).`
    };
  }

  // ----------------------------------------------------
  // SETTLEMENTS (Sunday Weekly Payouts)
  // ----------------------------------------------------

  static async getSettlements(partnerCode?: string): Promise<PartnerSettlement[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        let query = 'SELECT * FROM partner_settlements ORDER BY created_at DESC';
        const params: any[] = [];
        if (partnerCode) {
          query = 'SELECT * FROM partner_settlements WHERE UPPER(partner_code) = ? ORDER BY created_at DESC';
          params.push(partnerCode.trim().toUpperCase());
        }
        const [rows] = await pool.query(query, params);
        if (Array.isArray(rows)) {
          return (rows as any[]).map(s => ({
            id: s.id,
            partnerId: s.partner_id,
            partnerCode: s.partner_code,
            partnerName: s.partner_name,
            settlementDate: s.settlement_date,
            settlementWeek: s.settlement_week,
            amount: Number(s.amount || 0),
            paymentMethod: s.payment_method,
            accountOrUpi: s.account_or_upi,
            transactionReference: s.transaction_reference,
            ordersCount: Number(s.orders_count || 0),
            notes: s.notes,
            status: s.status || 'Completed',
            createdAt: s.created_at
          }));
        }
      } catch (err) {
        console.warn('[PartnerRepo] MySQL getSettlements failed:', err);
      }
    }

    const all = await readJson<PartnerSettlement[]>(SETTLEMENTS_FILE, this.getInitialSettlements());
    if (partnerCode) {
      return all.filter(s => s.partnerCode.toUpperCase() === partnerCode.trim().toUpperCase());
    }
    return all;
  }

  static async createSettlement(settlementData: Partial<PartnerSettlement>): Promise<PartnerSettlement> {
    const id = settlementData.id || `stl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const newSettlement: PartnerSettlement = {
      id,
      partnerId: settlementData.partnerId || '',
      partnerCode: (settlementData.partnerCode || '').toUpperCase(),
      partnerName: settlementData.partnerName || '',
      settlementDate: settlementData.settlementDate || new Date().toISOString().split('T')[0],
      settlementWeek: settlementData.settlementWeek || `Week Ending ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      amount: Number(settlementData.amount || 0),
      paymentMethod: settlementData.paymentMethod || 'UPI',
      accountOrUpi: settlementData.accountOrUpi || '',
      transactionReference: settlementData.transactionReference || `TXN${Date.now()}`,
      ordersCount: Number(settlementData.ordersCount || 0),
      notes: settlementData.notes || 'Weekly Sunday Settlement for Business Partner',
      status: settlementData.status || 'Completed',
      createdAt: now
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO partner_settlements (
            id, partner_id, partner_code, partner_name, settlement_date,
            settlement_week, amount, payment_method, account_or_upi,
            transaction_reference, orders_count, notes, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newSettlement.id,
            newSettlement.partnerId,
            newSettlement.partnerCode,
            newSettlement.partnerName,
            newSettlement.settlementDate,
            newSettlement.settlementWeek,
            newSettlement.amount,
            newSettlement.paymentMethod,
            newSettlement.accountOrUpi,
            newSettlement.transactionReference,
            newSettlement.ordersCount,
            newSettlement.notes,
            newSettlement.status,
            newSettlement.createdAt
          ]
        );
      } catch (err) {
        console.warn('[PartnerRepo] MySQL insert settlement failed:', err);
      }
    }

    const all = await readJson<PartnerSettlement[]>(SETTLEMENTS_FILE, this.getInitialSettlements());
    all.unshift(newSettlement);
    await writeJson(SETTLEMENTS_FILE, all);

    // Update Partner Paid Balance
    const partner = await this.getById(newSettlement.partnerId) || (newSettlement.partnerCode ? await this.getByCode(newSettlement.partnerCode) : null);
    if (partner) {
      const newPaid = (partner.totalCommissionPaid || 0) + newSettlement.amount;
      const newPending = Math.max(0, (partner.totalCommissionEarned || 0) - newPaid);
      await this.update(partner.id, {
        totalCommissionPaid: newPaid,
        pendingCommission: newPending
      });

      // Send professional payout email in background
      if (partner.email) {
        import('../utils/mailer').then(({ sendPartnerPaymentReceivedEmail }) => {
          sendPartnerPaymentReceivedEmail(partner, newSettlement).catch((err) => {
            console.error('[PartnerRepo] Error triggering partner payment received email:', err);
          });
        }).catch((err) => {
          console.error('[PartnerRepo] Failed to dynamically load mailer for partner payment email:', err);
        });
      }
    }

    return newSettlement;
  }

  // ----------------------------------------------------
  // STATS & DASHBOARD AGGREGATES
  // ----------------------------------------------------

  static async getStats(): Promise<PartnerDashboardStats> {
    const partners = await this.getAll();
    const referrals = await this.getReferrals();
    const settlements = await this.getSettlements();

    const activePartners = partners.filter(p => p.status === 'active' || p.status === 'approved').length;
    const pendingApplications = partners.filter(p => p.status === 'pending').length;

    const totalReferredOrders = referrals.length;
    const totalReferredSales = referrals.reduce((sum, r) => sum + (r.orderTotal || 0), 0);

    // Orders marked DELIVERED or FULLY PAID earn commission
    const eligibleReferrals = referrals.filter(r => (r.status === 'eligible' || r.status === 'settled' || r.isDelivered) && r.orderStatus?.toLowerCase() !== 'cancelled');
    const onHoldReferrals = referrals.filter(r => r.status === 'on_hold' && r.orderStatus?.toLowerCase() !== 'cancelled');

    const totalCommissionEarned = eligibleReferrals.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
    const totalOnHoldCommission = onHoldReferrals.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
    const totalCommissionPaid = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);

    // Calculate total pending payout by summing each partner's pending commission
    const totalPendingPayout = Math.round(partners.reduce((sum, p) => sum + (p.pendingCommission || 0), 0) * 100) / 100;

    return {
      totalPartners: partners.length,
      activePartners,
      pendingApplications,
      totalReferredOrders,
      totalReferredSales,
      totalSalesThroughPartners: totalReferredSales,
      totalCommissionEarned,
      totalCommissionPaid,
      totalPaidCommissions: totalCommissionPaid,
      totalPendingPayout,
      pendingSundayPayouts: totalPendingPayout,
      totalOnHoldCommission
    };
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  private static mapDbToPartner(r: any): BusinessPartner {
    return {
      id: r.id,
      partnerCode: r.partner_code,
      fullName: r.full_name,
      phone: r.phone,
      email: r.email,
      city: r.city,
      state: r.state,
      socialPlatform: r.social_platform,
      socialHandle: r.social_handle,
      bankAccountName: r.bank_account_name,
      bankName: r.bank_name,
      bankAccountNumber: r.bank_account_number,
      ifscCode: r.ifsc_code,
      upiId: r.upi_id,
      aadhaarPanNumber: r.aadhaar_pan_number,
      documentUrl: r.document_url,
      status: r.status || 'pending',
      paymentStatus: r.payment_status || 'paid',
      paymentRef: r.payment_ref || r.transaction_id || r.razorpay_payment_id || undefined,
      transactionId: r.transaction_id || r.razorpay_payment_id || r.payment_ref || undefined,
      razorpayPaymentId: r.razorpay_payment_id || r.payment_ref || undefined,
      razorpayOrderId: r.razorpay_order_id || undefined,
      paymentAmount: Number(r.payment_amount !== undefined && r.payment_amount !== null ? r.payment_amount : 699),
      paymentDate: r.payment_date || undefined,
      commissionRate: Number(r.commission_rate || 12),
      customerDiscountRate: Number(r.customer_discount_rate || 4),
      totalOrdersCount: Number(r.total_orders_count || 0),
      totalSalesAmount: Number(r.total_sales_amount || 0),
      totalCommissionEarned: Number(r.total_commission_earned || 0),
      totalCommissionPaid: Number(r.total_commission_paid || 0),
      pendingCommission: Number(r.pending_commission || 0),
      onHoldCommission: Number(r.on_hold_commission !== undefined ? r.on_hold_commission : 0),
      deliveredOrdersCount: Number(r.delivered_orders_count !== undefined ? r.delivered_orders_count : 0),
      referredByPartnerCode: r.referred_by_partner_code || undefined,
      referralBonusEarned: Number(r.referral_bonus_earned || 0),
      notes: r.notes,
      approvedAt: r.approved_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  private static getInitialPartners(): BusinessPartner[] {
    return [];
  }

  private static getInitialReferrals(): PartnerOrderReferral[] {
    return [];
  }

  private static getInitialSettlements(): PartnerSettlement[] {
    return [];
  }
}
