import { StockNotification } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const FILE_NAME = 'stock_notifications.json';

export class StockNotificationRepository {
  static async getAll(): Promise<StockNotification[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM stock_notifications ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          return (rows as any[]).map(r => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSlug: r.product_slug || undefined,
            productImage: r.product_image || undefined,
            email: r.email,
            status: r.status || 'pending',
            createdAt: r.created_at,
            notifiedAt: r.notified_at || undefined
          }));
        }
      } catch (err) {
        console.warn('[StockNotifRepo] MySQL query failed, falling back to JSON:', err);
      }
    }
    return readJson<StockNotification[]>(FILE_NAME, []);
  }

  static async getPendingForProduct(productId: string): Promise<StockNotification[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query(
          'SELECT * FROM stock_notifications WHERE (product_id = ? OR product_slug = ?) AND status = "pending" ORDER BY created_at ASC',
          [productId, productId]
        );
        if (Array.isArray(rows)) {
          return (rows as any[]).map(r => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            productSlug: r.product_slug || undefined,
            productImage: r.product_image || undefined,
            email: r.email,
            status: r.status || 'pending',
            createdAt: r.created_at,
            notifiedAt: r.notified_at || undefined
          }));
        }
      } catch (err) {
        console.warn('[StockNotifRepo] MySQL getPendingForProduct failed:', err);
      }
    }
    const all = await readJson<StockNotification[]>(FILE_NAME, []);
    return all.filter(n => (n.productId === productId || n.productSlug === productId) && n.status === 'pending');
  }

  static async create(data: {
    productId: string;
    productName: string;
    productSlug?: string;
    productImage?: string;
    email: string;
  }): Promise<{ notification: StockNotification; isNew: boolean }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const all = await this.getAll();

    // Check if duplicate pending request exists
    const existing = all.find(
      n =>
        (n.productId === data.productId || (data.productSlug && n.productSlug === data.productSlug)) &&
        n.email.toLowerCase() === cleanEmail &&
        n.status === 'pending'
    );

    if (existing) {
      return { notification: existing, isNew: false };
    }

    const newNotification: StockNotification = {
      id: `sn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: data.productId,
      productName: data.productName,
      productSlug: data.productSlug,
      productImage: data.productImage,
      email: cleanEmail,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO stock_notifications (id, product_id, product_name, product_slug, product_image, email, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
          [
            newNotification.id,
            newNotification.productId,
            newNotification.productName,
            newNotification.productSlug || null,
            newNotification.productImage || null,
            newNotification.email
          ]
        );
        return { notification: newNotification, isNew: true };
      } catch (err) {
        console.warn('[StockNotifRepo] MySQL insert failed, falling back to JSON:', err);
      }
    }

    const list = await readJson<StockNotification[]>(FILE_NAME, []);
    list.push(newNotification);
    await writeJson(FILE_NAME, list);
    return { notification: newNotification, isNew: true };
  }

  static async markAsNotified(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          'UPDATE stock_notifications SET status = "notified", notified_at = NOW() WHERE id = ?',
          [id]
        );
      } catch (err) {
        console.warn('[StockNotifRepo] MySQL update failed:', err);
      }
    }

    const list = await readJson<StockNotification[]>(FILE_NAME, []);
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].status = 'notified';
      list[idx].notifiedAt = now;
      await writeJson(FILE_NAME, list);
    }
    return true;
  }

  static async markAllNotifiedForProduct(productId: string): Promise<number> {
    const pending = await this.getPendingForProduct(productId);
    for (const item of pending) {
      await this.markAsNotified(item.id);
    }
    return pending.length;
  }

  static async delete(id: string): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM stock_notifications WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[StockNotifRepo] MySQL delete failed:', err);
      }
    }

    const list = await readJson<StockNotification[]>(FILE_NAME, []);
    const filtered = list.filter(n => n.id !== id);
    await writeJson(FILE_NAME, filtered);
    return true;
  }
}
