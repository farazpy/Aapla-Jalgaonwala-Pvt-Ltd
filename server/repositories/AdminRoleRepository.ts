import { AdminRole, PermissionKey } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const ROLES_FILE = 'admin_roles.json';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; group: string; description: string }[] = [
  // Dashboard
  { key: 'dashboard', label: 'Home / Dashboard Metrics', group: 'Overview', description: 'View high-level revenue, order volume, and store analytics' },

  // Catalog & Products
  { key: 'products', label: 'All Products Catalog', group: 'Catalog & Inventory', description: 'Browse and edit existing products, pricing, and stock' },
  { key: 'add_product', label: 'Add New Product', group: 'Catalog & Inventory', description: 'Create and publish new products with images & variants' },
  { key: 'categories', label: 'Categories Management', group: 'Catalog & Inventory', description: 'Create, modify, and reorganize store categories' },
  { key: 'shravan', label: 'Shravan & Upwas Curator', group: 'Catalog & Inventory', description: 'Curate fasting products and seasonal collections' },

  // Sales & Customers
  { key: 'orders', label: 'Orders & Dispatch', group: 'Sales & Orders', description: 'View, filter, export, and update customer order dispatch statuses' },
  { key: 'customers', label: 'Customers Data', group: 'Sales & Orders', description: 'View registered customer database, purchase history, and addresses' },
  { key: 'reviews', label: 'Product Reviews & Ratings', group: 'Sales & Orders', description: 'Moderate customer ratings and publish official store replies' },
  { key: 'coupons', label: 'Coupons & Discounts', group: 'Sales & Orders', description: 'Create and manage discount codes and promotional vouchers' },
  { key: 'cod_settings', label: 'COD Advance Fee Rules', group: 'Sales & Orders', description: 'Configure partial advance payment fee for Cash on Delivery orders' },

  // Women Partner Program
  { key: 'partners', label: 'Women Partner Program', group: 'Partner Network', description: 'Manage partner onboarding, view referral links and sales performance' },
  { key: 'settlements', label: 'Partner Payouts & Settlements', group: 'Partner Network', description: 'Approve and record weekly Sunday commission payouts' },

  // Storefront & Branding
  { key: 'seo', label: 'SEO & Meta Tags Manager', group: 'Storefront & Media', description: 'Configure Google search titles, descriptions, and OpenGraph images' },
  { key: 'branding', label: 'App Logo & Branding', group: 'Storefront & Media', description: 'Update official store logo, typography, and brand themes' },
  { key: 'favicons', label: 'Favicons & PWA Icons', group: 'Storefront & Media', description: 'Manage site icons, Apple touch icons, and Android PWA manifests' },
  { key: 'owners', label: 'Owners & Founders Profile', group: 'Storefront & Media', description: 'Update leadership bios, quotes, and heritage photos' },
  { key: 'media', label: 'Our Story Media & Gallery', group: 'Storefront & Media', description: 'Upload and organize media gallery for store story and banners' },

  // Systems & Administration
  { key: 'configs', label: 'Website Configs & SMTP', group: 'Systems & Security', description: 'Configure email SMTP credentials, phone notifications, and Telegram bot' },
  { key: 'database', label: 'MySQL Database Tools', group: 'Systems & Security', description: 'Inspect MySQL tables, execute safe queries, and test connections' },
  { key: 'schema', label: 'SQL Schema Inspector', group: 'Systems & Security', description: 'Inspect database DDL schema and indexes' },
  { key: 'cache', label: 'Cache & Speed Engine', group: 'Systems & Security', description: 'Purge edge memory cache and monitor response time stats' },
  { key: 'roles_management', label: 'Admin Roles & Staff Access', group: 'Systems & Security', description: 'Create custom roles, invite staff, and assign permission privileges' }
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = ALL_PERMISSIONS.map(p => p.key);

const DEFAULT_SYSTEM_ROLES: AdminRole[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Unrestricted master access to all store modules, databases, configs, and staff permissions.',
    permissions: [...ALL_PERMISSION_KEYS],
    isSystem: true,
    color: 'rose',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_admin',
    name: 'Operations Sub-Admin',
    description: 'Comprehensive administrative access for day-to-day operations excluding core database & SMTP credentials.',
    permissions: [
      'dashboard',
      'products',
      'add_product',
      'categories',
      'shravan',
      'orders',
      'customers',
      'partners',
      'settlements',
      'reviews',
      'coupons',
      'cod_settings',
      'seo',
      'branding',
      'media',
      'cache'
    ],
    isSystem: true,
    color: 'amber',
    createdAt: new Date().toISOString()
  },
  {
    id: 'order_manager',
    name: 'Order & Dispatch Specialist',
    description: 'Dedicated to processing customer orders, tracking shipments, reviewing addresses, and COD settings.',
    permissions: ['dashboard', 'orders', 'customers', 'cod_settings', 'reviews'],
    isSystem: true,
    color: 'blue',
    createdAt: new Date().toISOString()
  },
  {
    id: 'catalog_manager',
    name: 'Catalog & Inventory Specialist',
    description: 'Manages product catalog, pricing, variants, stock, categories, seasonal curators, and media gallery.',
    permissions: ['dashboard', 'products', 'add_product', 'categories', 'shravan', 'media', 'reviews'],
    isSystem: true,
    color: 'emerald',
    createdAt: new Date().toISOString()
  },
  {
    id: 'partner_coordinator',
    name: 'Women Partner Coordinator',
    description: 'Manages women business partner network, onboarding approvals, sales tracking, and settlement records.',
    permissions: ['dashboard', 'partners', 'settlements', 'orders', 'customers'],
    isSystem: true,
    color: 'pink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'marketing_seo',
    name: 'Marketing & SEO Manager',
    description: 'Controls discount coupons, search engine metadata, storefront branding, and customer reviews.',
    permissions: ['dashboard', 'coupons', 'seo', 'branding', 'favicons', 'media', 'reviews'],
    isSystem: true,
    color: 'purple',
    createdAt: new Date().toISOString()
  },
  {
    id: 'customer_support',
    name: 'Customer Support Representative',
    description: 'View order statuses, customer contact details, and respond to product reviews.',
    permissions: ['dashboard', 'orders', 'customers', 'reviews'],
    isSystem: true,
    color: 'indigo',
    createdAt: new Date().toISOString()
  }
];

export class AdminRoleRepository {
  static async getAll(): Promise<AdminRole[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM admin_roles ORDER BY created_at ASC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []),
            isSystem: Boolean(r.is_system),
            color: r.color || 'blue',
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
          }));
        }
      } catch {
        // Fallback to JSON
      }
    }

    const saved = await readJson<AdminRole[]>(ROLES_FILE, []);
    if (!saved || saved.length === 0) {
      await writeJson(ROLES_FILE, DEFAULT_SYSTEM_ROLES);
      return DEFAULT_SYSTEM_ROLES;
    }

    // Merge system roles if missing
    let hasMissingSystemRole = false;
    const merged = [...saved];
    for (const sysRole of DEFAULT_SYSTEM_ROLES) {
      const exists = merged.some(r => r.id === sysRole.id);
      if (!exists) {
        merged.push(sysRole);
        hasMissingSystemRole = true;
      }
    }

    if (hasMissingSystemRole) {
      await writeJson(ROLES_FILE, merged);
    }

    return merged;
  }

  static async getById(id: string): Promise<AdminRole | null> {
    const all = await this.getAll();
    return all.find(r => r.id.toLowerCase() === id.toLowerCase()) || null;
  }

  static async create(roleData: Partial<AdminRole>): Promise<AdminRole> {
    const name = (roleData.name || 'New Role').trim();
    const id = (roleData.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `role_${Date.now()}`).toLowerCase();
    
    const newRole: AdminRole = {
      id,
      name,
      description: roleData.description || 'Custom administrative role with tailored permissions.',
      permissions: Array.isArray(roleData.permissions) ? roleData.permissions : [],
      isSystem: false,
      color: roleData.color || 'indigo',
      createdAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO admin_roles (id, name, description, permissions, is_system, color)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), permissions = VALUES(permissions), color = VALUES(color)`,
          [newRole.id, newRole.name, newRole.description, JSON.stringify(newRole.permissions), newRole.isSystem ? 1 : 0, newRole.color]
        );
      } catch (err) {
        console.warn('[AdminRoleRepo] MySQL insert role failed:', err);
      }
    }

    const all = await this.getAll();
    const existingIndex = all.findIndex(r => r.id === newRole.id);
    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...newRole };
    } else {
      all.push(newRole);
    }

    await writeJson(ROLES_FILE, all);
    return newRole;
  }

  static async update(id: string, updates: Partial<AdminRole>): Promise<AdminRole | null> {
    const all = await this.getAll();
    const idx = all.findIndex(r => r.id.toLowerCase() === id.toLowerCase());
    if (idx < 0) return null;

    const existing = all[idx];
    const updated: AdminRole = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot change
      isSystem: existing.isSystem, // system flag immutable
      updatedAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE admin_roles SET name = ?, description = ?, permissions = ?, color = ?, updated_at = NOW() WHERE id = ?`,
          [updated.name, updated.description, JSON.stringify(updated.permissions), updated.color || 'blue', id]
        );
      } catch (err) {
        console.warn('[AdminRoleRepo] MySQL update role failed:', err);
      }
    }

    all[idx] = updated;
    await writeJson(ROLES_FILE, all);
    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    const all = await this.getAll();
    const roleToDelete = all.find(r => r.id.toLowerCase() === id.toLowerCase());
    if (!roleToDelete) return false;
    if (roleToDelete.isSystem) {
      throw new Error(`System role "${roleToDelete.name}" cannot be deleted.`);
    }

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM admin_roles WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[AdminRoleRepo] MySQL delete role failed:', err);
      }
    }

    const filtered = all.filter(r => r.id.toLowerCase() !== id.toLowerCase());
    await writeJson(ROLES_FILE, filtered);
    return true;
  }
}
