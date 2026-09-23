import { Order } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { ProductRepository } from './ProductRepository';

const FILE_NAME = 'orders.json';

let orderMemoryCache: { data: Order[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds fast read cache (instant invalidation on any create/update)

export class OrderRepository {
  public static clearCache() {
    orderMemoryCache = null;
  }

  private static mapSingleOrder(row: any, itemsMap: Map<string, any[]>): Order {
    const rawItems = itemsMap.get(String(row.id)) || [];
    const items = rawItems.map(i => ({
      id: String(i.id),
      productId: String(i.product_id),
      productName: i.product_name,
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      profit: i.profit !== undefined && i.profit !== null ? Number(i.profit) : 0,
      variantInfo: i.variant_info || undefined
    }));

    let shippingAddress = row.shipping_address_json;
    if (typeof shippingAddress === 'string') {
      try {
        shippingAddress = JSON.parse(shippingAddress);
      } catch (_) {
        shippingAddress = {
          fullName: row.customer_name || 'Customer',
          phone: row.customer_phone || '',
          addressLine1: 'Main Street',
          city: 'Jalgaon',
          state: 'Maharashtra',
          pincode: '425001'
        };
      }
    }

    let paymentDetails = row.payment_details_json;
    if (typeof paymentDetails === 'string') {
      try {
        paymentDetails = JSON.parse(paymentDetails);
      } catch (_) {
        paymentDetails = undefined;
      }
    }

    const subtotal = Number(row.subtotal) || 0;
    let discount = Number(row.discount) || 0;
    const refCode = row.referral_partner_code || (row.coupon_code && (row.coupon_code.toUpperCase().startsWith('WBP-') || row.coupon_code.toUpperCase().startsWith('AJW-')) ? row.coupon_code : undefined);
    if (discount === 0 && (refCode || (row.notes && /Discount from/i.test(row.notes)))) {
      discount = Math.round(subtotal * 0.04);
    }
    const shippingFee = Number(row.shipping_fee) || 0;
    let totalAmount = Number(row.total_amount) || 0;
    if (totalAmount === 0 || (discount > 0 && totalAmount === subtotal + shippingFee)) {
      totalAmount = Math.max(0, subtotal - discount + shippingFee);
    }
    const codAdvanceFeePaid = row.cod_advance_fee_paid ? Number(row.cod_advance_fee_paid) : 0;
    let codRemainingBalance = row.cod_remaining_balance !== null && row.cod_remaining_balance !== undefined 
      ? Number(row.cod_remaining_balance) 
      : 0;
    if (row.payment_method === 'COD' && codRemainingBalance === 0 && row.payment_status !== 'Paid') {
      codRemainingBalance = codAdvanceFeePaid > 0 ? Math.max(0, totalAmount - codAdvanceFeePaid) : totalAmount;
    }

    return {
      id: String(row.id),
      orderNumber: row.order_number,
      customer: {
        id: row.customer_id ? String(row.customer_id) : undefined,
        name: row.customer_name || '',
        email: row.customer_email || '',
        phone: row.customer_phone || ''
      },
      shippingAddress,
      items,
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      couponCode: row.coupon_code || undefined,
      referralPartnerCode: row.referral_partner_code || undefined,
      status: row.status || 'Pending',
      paymentStatus: row.payment_status || 'Pending',
      paymentMethod: row.payment_method || 'COD',
      codAdvanceFeePaid,
      codRemainingBalance,
      awbNumber: row.awb_number || undefined,
      courierName: row.courier_name || (row.awb_number ? 'DTDC' : undefined),
      trackingUrl: row.tracking_url || (row.awb_number ? `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${row.awb_number}` : undefined),
      paymentDetails: paymentDetails || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
    };
  }

  static async getAll(): Promise<Order[]> {
    if (orderMemoryCache && (Date.now() - orderMemoryCache.timestamp < CACHE_TTL_MS)) {
      return orderMemoryCache.data;
    }

    const pool = getDbPool();
    let rawOrders: Order[] = [];

    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          const orderIds = rows.map((r: any) => r.id);
          const itemsMap = new Map<string, any[]>();

          // Batch fetch ALL order_items in 1 single query instead of N serial queries
          if (orderIds.length > 0) {
            try {
              const [itemRows]: any = await pool.query(
                'SELECT * FROM order_items WHERE order_id IN (?)',
                [orderIds]
              );
              if (Array.isArray(itemRows)) {
                for (const item of itemRows) {
                  const oid = String(item.order_id);
                  if (!itemsMap.has(oid)) {
                    itemsMap.set(oid, []);
                  }
                  itemsMap.get(oid)!.push(item);
                }
              }
            } catch (_) {
              // Ignore batch item query error
            }
          }

          rawOrders = rows.map((r: any) => this.mapSingleOrder(r, itemsMap));
        }
      } catch (err) {
        console.warn('[OrderRepo] MySQL query failed, using JSON fallback:', err);
      }
    }

    if (rawOrders.length === 0) {
      rawOrders = await readJson<Order[]>(FILE_NAME, []);
    }

    // Enrich legacy orders with non-zero item prices if stored as 0
    let productsList: any[] = [];
    try {
      productsList = await ProductRepository.getAll(true);
    } catch {
      productsList = [];
    }
    const productMap = new Map(productsList.map(p => [p.id, p]));

    const enrichedOrders = rawOrders.map(order => {
      let calcSubtotal = order.subtotal || 0;
      const updatedItems = order.items.map(it => {
        let p = it.price || 0;
        if (!p && it.productId) {
          const matchedProd = productMap.get(it.productId);
          if (matchedProd && matchedProd.price) {
            p = matchedProd.price;
          }
        }
        return {
          ...it,
          price: p,
          image: it.image || (productMap.get(it.productId)?.images?.[0]?.url) || undefined
        };
      });

      const newItemsSubtotal = updatedItems.reduce((acc, i) => acc + ((i.price || 0) * (i.quantity || 1)), 0);
      if (calcSubtotal === 0 && newItemsSubtotal > 0) {
        calcSubtotal = newItemsSubtotal;
      }

      return {
        ...order,
        items: updatedItems,
        subtotal: calcSubtotal,
        totalAmount: order.totalAmount > 0 ? order.totalAmount : Math.max(0, calcSubtotal - (order.discount || 0) + (order.shippingFee || 0))
      };
    });

    orderMemoryCache = { data: enrichedOrders, timestamp: Date.now() };
    return enrichedOrders;
  }

  static async getById(id: string): Promise<Order | null> {
    if (orderMemoryCache && (Date.now() - orderMemoryCache.timestamp < CACHE_TTL_MS)) {
      const match = orderMemoryCache.data.find(o => o.id === id || o.orderNumber === id);
      if (match) return match;
    }

    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1',
          [id, id]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const [itemRows]: any = await pool.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [row.id]
          );
          const itemsMap = new Map<string, any[]>([[String(row.id), Array.isArray(itemRows) ? itemRows : []]]);
          return this.mapSingleOrder(row, itemsMap);
        }
      } catch (_) {}
    }

    const orders = await this.getAll();
    return orders.find(o => o.id === id || o.orderNumber === id) || null;
  }

  static async getByUser(identifier: { userId?: string; email?: string; phone?: string }): Promise<Order[]> {
    const all = await this.getAll();
    return all.filter(o => {
      if (identifier.userId && o.customer?.id === identifier.userId) return true;
      if (identifier.email && o.customer?.email && o.customer.email.toLowerCase() === identifier.email.toLowerCase()) return true;
      if (identifier.phone && o.customer?.phone && o.customer.phone.replace(/\D/g, '').endsWith(identifier.phone.replace(/\D/g, '').slice(-10))) return true;
      return false;
    });
  }

  static async create(rawOrder: Partial<Order>): Promise<Order> {
    this.clearCache();
    const id = rawOrder.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = rawOrder.orderNumber || `AJW-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let productsList: any[] = [];
    try {
      productsList = await ProductRepository.getAll(true);
    } catch {
      productsList = [];
    }
    const productMap = new Map(productsList.map(p => [p.id, p]));

    // Ensure all items have IDs and numeric prices
    const items = (rawOrder.items || []).map((item, idx) => {
      let itemPrice = Number(item.price) || 0;
      if (!itemPrice && item.productId) {
        const found = productMap.get(item.productId);
        if (found && found.price) {
          itemPrice = found.price;
        }
      }
      const itemProfit = item.profit !== undefined ? Number(item.profit) : Number(productMap.get(item.productId)?.profit || 0);
      return {
        id: item.id || `item_${Date.now()}_${idx}`,
        productId: item.productId || 'p_unknown',
        productName: item.productName || 'Special Jalgaon Snack',
        quantity: Number(item.quantity) || 1,
        price: itemPrice,
        profit: itemProfit,
        variantInfo: item.variantInfo || undefined,
        image: item.image || (productMap.get(item.productId)?.images?.[0]?.url) || undefined
      };
    });

    const subtotal = rawOrder.subtotal !== undefined && Number(rawOrder.subtotal) > 0
      ? Number(rawOrder.subtotal) 
      : items.reduce((acc, it) => acc + (it.price * it.quantity), 0);

    const referralPartnerCode = rawOrder.referralPartnerCode || (rawOrder as any).partnerCode || (rawOrder as any).referralCode || (rawOrder.couponCode && (rawOrder.couponCode.toUpperCase().startsWith('WBP-') || rawOrder.couponCode.toUpperCase().startsWith('AJW-')) ? rawOrder.couponCode.toUpperCase() : undefined);

    let discount = Number(rawOrder.discount) || Number((rawOrder as any).discountAmount) || 0;
    if (discount === 0 && (referralPartnerCode || (rawOrder.notes && /Discount from/i.test(rawOrder.notes)))) {
      discount = Math.round(subtotal * 0.04);
    }

    const shippingFee = rawOrder.shippingFee !== undefined ? Number(rawOrder.shippingFee) : (subtotal >= 499 || subtotal === 0 ? 0 : 40);
    const totalAmount = rawOrder.totalAmount !== undefined && Number(rawOrder.totalAmount) > 0 && (rawOrder.totalAmount !== subtotal + shippingFee || discount === 0)
      ? Number(rawOrder.totalAmount) 
      : Math.max(0, subtotal - discount + shippingFee);

    const order: Order = {
      id,
      orderNumber,
      customer: {
        id: rawOrder.customer?.id || undefined,
        name: rawOrder.customer?.name || 'Valued Customer',
        email: rawOrder.customer?.email || '',
        phone: rawOrder.customer?.phone || ''
      },
      shippingAddress: rawOrder.shippingAddress || {
        fullName: rawOrder.customer?.name || 'Customer',
        phone: rawOrder.customer?.phone || '',
        addressLine1: 'Main Street',
        city: 'Jalgaon',
        state: 'Maharashtra',
        pincode: '425001'
      },
      items,
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      couponCode: rawOrder.couponCode || undefined,
      referralPartnerCode: referralPartnerCode || undefined,
      status: rawOrder.status || 'Pending',
      paymentStatus: rawOrder.paymentStatus || 'Pending',
      paymentMethod: rawOrder.paymentMethod || 'COD',
      codAdvanceFeePaid: Number(rawOrder.codAdvanceFeePaid || 0),
      codRemainingBalance: rawOrder.codRemainingBalance !== undefined ? Number(rawOrder.codRemainingBalance) : (rawOrder.paymentMethod === 'COD' ? totalAmount : 0),
      awbNumber: rawOrder.awbNumber || undefined,
      courierName: rawOrder.courierName || (rawOrder.awbNumber ? 'DTDC' : undefined),
      trackingUrl: rawOrder.trackingUrl || (rawOrder.awbNumber ? `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${rawOrder.awbNumber}` : undefined),
      paymentDetails: rawOrder.paymentDetails || undefined,
      notes: rawOrder.notes || undefined,
      createdAt: rawOrder.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, shipping_address_json, subtotal, discount, shipping_fee, total_amount, coupon_code, referral_partner_code, status, payment_status, payment_method, cod_advance_fee_paid, cod_remaining_balance, awb_number, courier_name, tracking_url, payment_details_json, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            order.orderNumber,
            order.customer.id || null,
            order.customer.name,
            order.customer.email,
            order.customer.phone,
            JSON.stringify(order.shippingAddress),
            order.subtotal,
            order.discount,
            order.shippingFee,
            order.totalAmount,
            order.couponCode || null,
            order.referralPartnerCode || null,
            order.status,
            order.paymentStatus,
            order.paymentMethod,
            order.codAdvanceFeePaid || 0,
            order.codRemainingBalance || 0,
            order.awbNumber || null,
            order.courierName || null,
            order.trackingUrl || null,
            order.paymentDetails ? JSON.stringify(order.paymentDetails) : null,
            order.notes || null
          ]
        );

        if (order.items.length > 0) {
          const itemValues = order.items.map(it => [
            it.id,
            order.id,
            it.productId,
            it.productName,
            it.quantity,
            it.price,
            it.profit || 0,
            it.variantInfo || null
          ]);

          // Batch insert order items
          await pool.query(
            `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, profit, variant_info) VALUES ?`,
            [itemValues]
          ).catch(async () => {
            for (const item of order.items) {
              await pool.query(
                `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, profit, variant_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [item.id, order.id, item.productId, item.productName, item.quantity, item.price, item.profit || 0, item.variantInfo || null]
              ).catch(() => {});
            }
          });
        }
      } catch (err) {
        console.warn('[OrderRepo] MySQL insert failed, saving to JSON fallback:', err);
      }
    }

    const orders = await readJson<Order[]>(FILE_NAME, []);
    orders.unshift(order);
    await writeJson(FILE_NAME, orders);
    return order;
  }

  static async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    this.clearCache();
    const pool = getDbPool();
    if (pool) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
        if (updates.paymentStatus) { fields.push('payment_status = ?'); values.push(updates.paymentStatus); }
        if (updates.paymentMethod) { fields.push('payment_method = ?'); values.push(updates.paymentMethod); }
        if (updates.subtotal !== undefined) { fields.push('subtotal = ?'); values.push(updates.subtotal); }
        if (updates.discount !== undefined) { fields.push('discount = ?'); values.push(updates.discount); }
        if (updates.shippingFee !== undefined) { fields.push('shipping_fee = ?'); values.push(updates.shippingFee); }
        if (updates.totalAmount !== undefined) { fields.push('total_amount = ?'); values.push(updates.totalAmount); }
        if (updates.codAdvanceFeePaid !== undefined) { fields.push('cod_advance_fee_paid = ?'); values.push(updates.codAdvanceFeePaid); }
        if (updates.codRemainingBalance !== undefined) { fields.push('cod_remaining_balance = ?'); values.push(updates.codRemainingBalance); }
        if (updates.awbNumber !== undefined) { fields.push('awb_number = ?'); values.push(updates.awbNumber); }
        if (updates.courierName !== undefined) { fields.push('courier_name = ?'); values.push(updates.courierName); }
        if (updates.trackingUrl !== undefined) { fields.push('tracking_url = ?'); values.push(updates.trackingUrl); }
        if (updates.paymentDetails) { fields.push('payment_details_json = ?'); values.push(JSON.stringify(updates.paymentDetails)); }
        if (updates.notes) { fields.push('notes = ?'); values.push(updates.notes); }
        if (updates.referralPartnerCode !== undefined) { fields.push('referral_partner_code = ?'); values.push(updates.referralPartnerCode); }
        if (fields.length > 0) {
          fields.push('updated_at = NOW()');
          values.push(id);
          values.push(id);
          await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ? OR order_number = ?`, values);
        }
      } catch (err) {
        console.warn('[OrderRepo] MySQL update failed, using JSON fallback:', err);
      }
    }

    try {
      const orders = await readJson<Order[]>(FILE_NAME, []);
      const index = orders.findIndex(o => o.id === id || o.orderNumber === id);
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        await writeJson(FILE_NAME, orders);
      }
    } catch (err) {
      console.error('[OrderRepo] JSON update failed:', err);
    }

    // Always fetch and return the latest updated order
    const latest = await this.getById(id);
    return latest;
  }

  static async updatePaymentStatus(
    id: string,
    paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded',
    orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
    paymentMethod?: string
  ): Promise<boolean> {
    this.clearCache();
    const pool = getDbPool();
    let mysqlUpdated = false;

    if (pool) {
      try {
        const query = paymentMethod 
          ? `UPDATE orders SET payment_status = ?, status = ?, payment_method = ?, updated_at = NOW() WHERE id = ?`
          : `UPDATE orders SET payment_status = ?, status = ?, updated_at = NOW() WHERE id = ?`;
        
        const params = paymentMethod 
          ? [paymentStatus, orderStatus, paymentMethod, id]
          : [paymentStatus, orderStatus, id];

        const [result]: any = await pool.query(query, params);
        mysqlUpdated = result && result.affectedRows > 0;
      } catch (err) {
        console.warn('[OrderRepo] MySQL updatePaymentStatus failed, relying on JSON fallback:', err);
      }
    }

    try {
      const orders = await readJson<Order[]>(FILE_NAME, []);
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          paymentStatus,
          status: orderStatus,
          paymentMethod: paymentMethod || orders[index].paymentMethod,
          updatedAt: new Date().toISOString()
        };
        await writeJson(FILE_NAME, orders);
        return true;
      }
    } catch (err) {
      console.error('[OrderRepo] JSON updatePaymentStatus fallback failed:', err);
    }

    return mysqlUpdated;
  }

  static async delete(id: string): Promise<boolean> {
    this.clearCache();
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM order_items WHERE order_id = ?', [id]);
        await pool.query('DELETE FROM orders WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[OrderRepo] MySQL delete failed:', err);
      }
    }

    try {
      const orders = await readJson<Order[]>(FILE_NAME, []);
      const filtered = orders.filter(o => o.id !== id && o.orderNumber !== id);
      await writeJson(FILE_NAME, filtered);
      return true;
    } catch (err) {
      console.error('[OrderRepo] JSON delete failed:', err);
    }
    return false;
  }
}
