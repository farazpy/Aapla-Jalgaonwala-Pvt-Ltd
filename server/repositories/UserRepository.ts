import { User, UserAddress, PermissionKey } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { AdminRoleRepository } from './AdminRoleRepository';

const USERS_FILE = 'users.json';
const ADDRESSES_FILE = 'user_addresses.json';

let hasEnsuredAppAuthTokenColumn = false;

async function ensureAppAuthTokenColumn(pool: any): Promise<void> {
  if (hasEnsuredAppAuthTokenColumn) return;
  try {
    await pool.query('ALTER TABLE users ADD COLUMN app_auth_token VARCHAR(255) DEFAULT NULL');
    await pool.query('CREATE INDEX idx_users_app_auth_token ON users (app_auth_token)').catch(() => {});
    hasEnsuredAppAuthTokenColumn = true;
  } catch (err: any) {
    if (err?.code === 'ER_DUP_FIELDNAME' || err?.message?.includes('Duplicate column') || err?.message?.includes('already exists')) {
      hasEnsuredAppAuthTokenColumn = true;
    }
  }
}

export interface StoredUser extends User {
  passwordHash?: string;
  appAuthToken?: string;
  googleId?: string;
}

export const SUPER_ADMIN_EMAIL = 'operationalhtklabs@gmail.com';
export const SUPER_ADMIN_EMAILS = ['operationalhtklabs@gmail.com', 'farazk0792@gmail.com'];

function ensureSuperAdmin(users: StoredUser[]): StoredUser[] {
  for (const adminEmail of SUPER_ADMIN_EMAILS) {
    const superAdminIndex = users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    if (superAdminIndex >= 0) {
      const existing = users[superAdminIndex];
      users[superAdminIndex] = {
        ...existing,
        name: existing.name || 'Super Administrator',
        role: 'super_admin',
        isStaff: true,
        status: 'active',
        passwordHash: existing.passwordHash || 'admin123'
      };
    } else {
      users.unshift({
        id: `usr_super_admin_${adminEmail.split('@')[0]}`,
        name: 'Super Administrator',
        email: adminEmail,
        phone: '9822012345',
        role: 'super_admin',
        isStaff: true,
        status: 'active',
        passwordHash: 'admin123',
        authProvider: 'email',
        createdAt: '2025-01-01T00:00:00.000Z'
      });
    }
  }
  return users;
}

export class UserRepository {
  static async getAll(): Promise<StoredUser[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          const list = rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            passwordHash: r.password_hash || undefined,
            appAuthToken: r.app_auth_token || undefined,
            avatarUrl: r.avatar_url || undefined,
            authProvider: r.auth_provider || 'email',
            googleId: r.google_id || undefined,
            role: r.role || (r.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? 'super_admin' : 'customer'),
            isStaff: Boolean(r.is_staff || r.role === 'admin' || r.role === 'super_admin' || r.role === 'sub_admin' || r.email?.toLowerCase() === SUPER_ADMIN_EMAIL),
            customPermissions: typeof r.custom_permissions === 'string' ? JSON.parse(r.custom_permissions) : (r.custom_permissions || undefined),
            status: r.status || 'active',
            lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          }));
          return ensureSuperAdmin(list);
        }
      } catch (err) {
        console.warn('[UserRepo] MySQL getAll failed, using JSON fallback:', err);
      }
    }
    const raw = await readJson<StoredUser[]>(USERS_FILE, []);
    const ensured = ensureSuperAdmin(raw);
    if (ensured.length !== raw.length) {
      await writeJson(USERS_FILE, ensured);
    }
    return ensured;
  }

  static async findById(id: string): Promise<StoredUser | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            passwordHash: r.password_hash || undefined,
            appAuthToken: r.app_auth_token || undefined,
            avatarUrl: r.avatar_url || undefined,
            authProvider: r.auth_provider || 'email',
            googleId: r.google_id || undefined,
            role: r.role || (r.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? 'super_admin' : 'customer'),
            isStaff: Boolean(r.is_staff || r.role === 'admin' || r.role === 'super_admin' || r.role === 'sub_admin' || r.email?.toLowerCase() === SUPER_ADMIN_EMAIL),
            customPermissions: typeof r.custom_permissions === 'string' ? JSON.parse(r.custom_permissions) : (r.custom_permissions || undefined),
            status: r.status || 'active',
            lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          };
        }
      } catch (err) {
        console.warn('[UserRepo] MySQL findById error, falling back:', err);
      }
    }
    const all = await this.getAll();
    return all.find(u => u.id === id) || null;
  }

  static async findByEmail(email: string): Promise<StoredUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            passwordHash: r.password_hash || undefined,
            appAuthToken: r.app_auth_token || undefined,
            avatarUrl: r.avatar_url || undefined,
            authProvider: r.auth_provider || 'email',
            googleId: r.google_id || undefined,
            role: r.role || (r.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? 'super_admin' : 'customer'),
            isStaff: Boolean(r.is_staff || r.role === 'admin' || r.role === 'super_admin' || r.role === 'sub_admin' || r.email?.toLowerCase() === SUPER_ADMIN_EMAIL),
            customPermissions: typeof r.custom_permissions === 'string' ? JSON.parse(r.custom_permissions) : (r.custom_permissions || undefined),
            status: r.status || 'active',
            lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          };
        }
      } catch (err) {
        console.warn('[UserRepo] MySQL findByEmail error, falling back:', err);
      }
    }
    const all = await this.getAll();
    return all.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  static async findByPhone(phone: string): Promise<StoredUser | null> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM users WHERE phone LIKE ? LIMIT 1', [`%${cleanPhone}`]);
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            passwordHash: r.password_hash || undefined,
            appAuthToken: r.app_auth_token || undefined,
            avatarUrl: r.avatar_url || undefined,
            authProvider: r.auth_provider || 'email',
            googleId: r.google_id || undefined,
            role: r.role || 'customer',
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          };
        }
      } catch (err) {
        console.warn('[UserRepo] MySQL findByPhone error, falling back:', err);
      }
    }
    const all = await this.getAll();
    return all.find(u => u.phone && u.phone.replace(/\D/g, '').endsWith(cleanPhone)) || null;
  }

  static async findByGoogleId(googleId: string): Promise<StoredUser | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            passwordHash: r.password_hash || undefined,
            appAuthToken: r.app_auth_token || undefined,
            avatarUrl: r.avatar_url || undefined,
            authProvider: r.auth_provider || 'google',
            googleId: r.google_id || undefined,
            role: r.role || 'customer',
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          };
        }
      } catch (err) {
        console.warn('[UserRepo] MySQL findByGoogleId error, falling back:', err);
      }
    }
    const all = await this.getAll();
    return all.find(u => u.googleId === googleId) || null;
  }

  static async findByAppAuthToken(token: string): Promise<StoredUser | null> {
    if (!token || typeof token !== 'string') return null;
    const cleanToken = token.trim();
    const pool = getDbPool();
    if (pool) {
      try {
        await ensureAppAuthTokenColumn(pool);
        const [rows]: any = await pool.query('SELECT * FROM users WHERE app_auth_token = ? LIMIT 1', [cleanToken]);
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            passwordHash: r.password_hash || undefined,
            appAuthToken: r.app_auth_token || undefined,
            avatarUrl: r.avatar_url || undefined,
            authProvider: r.auth_provider || 'email',
            googleId: r.google_id || undefined,
            role: r.role || (r.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? 'super_admin' : 'customer'),
            isStaff: Boolean(r.is_staff || r.role === 'admin' || r.role === 'super_admin' || r.role === 'sub_admin' || r.email?.toLowerCase() === SUPER_ADMIN_EMAIL),
            customPermissions: typeof r.custom_permissions === 'string' ? JSON.parse(r.custom_permissions) : (r.custom_permissions || undefined),
            status: r.status || 'active',
            lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          };
        }
      } catch (err: any) {
        if (err?.code === 'ER_BAD_FIELD_ERROR' || err?.message?.includes('Unknown column')) {
          try {
            hasEnsuredAppAuthTokenColumn = false;
            await ensureAppAuthTokenColumn(pool);
            const [rows]: any = await pool.query('SELECT * FROM users WHERE app_auth_token = ? LIMIT 1', [cleanToken]);
            if (Array.isArray(rows) && rows.length > 0) {
              const r = rows[0];
              return {
                id: r.id,
                name: r.name,
                email: r.email,
                phone: r.phone || undefined,
                passwordHash: r.password_hash || undefined,
                appAuthToken: r.app_auth_token || undefined,
                avatarUrl: r.avatar_url || undefined,
                authProvider: r.auth_provider || 'email',
                googleId: r.google_id || undefined,
                role: r.role || (r.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? 'super_admin' : 'customer'),
                isStaff: Boolean(r.is_staff || r.role === 'admin' || r.role === 'super_admin' || r.role === 'sub_admin' || r.email?.toLowerCase() === SUPER_ADMIN_EMAIL),
                customPermissions: typeof r.custom_permissions === 'string' ? JSON.parse(r.custom_permissions) : (r.custom_permissions || undefined),
                status: r.status || 'active',
                lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
                createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
              };
            }
          } catch (retryErr) {
            console.warn('[UserRepo] MySQL findByAppAuthToken retry error:', retryErr);
          }
        } else {
          console.warn('[UserRepo] MySQL findByAppAuthToken error, falling back:', err);
        }
      }
    }
    const all = await this.getAll();
    return all.find(u => u.appAuthToken === cleanToken) || null;
  }

  static async create(user: Partial<StoredUser>): Promise<StoredUser> {
    const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const created: StoredUser = {
      id,
      name: user.name || 'User',
      email: (user.email || `${id}@user.local`).toLowerCase(),
      phone: user.phone || undefined,
      passwordHash: user.passwordHash || undefined,
      appAuthToken: user.appAuthToken || undefined,
      avatarUrl: user.avatarUrl || undefined,
      authProvider: user.authProvider || 'email',
      googleId: user.googleId || undefined,
      role: user.role || 'customer',
      createdAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await ensureAppAuthTokenColumn(pool);
        await pool.query(
          `INSERT INTO users (id, name, email, phone, password_hash, app_auth_token, avatar_url, auth_provider, google_id, role)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), avatar_url = VALUES(avatar_url), google_id = VALUES(google_id), auth_provider = VALUES(auth_provider), app_auth_token = VALUES(app_auth_token)`,
          [
            created.id,
            created.name,
            created.email,
            created.phone || null,
            created.passwordHash || null,
            created.appAuthToken || null,
            created.avatarUrl || null,
            created.authProvider || 'email',
            created.googleId || null,
            created.role || 'customer'
          ]
        );
      } catch (err: any) {
        if (err?.code === 'ER_BAD_FIELD_ERROR' || err?.message?.includes('Unknown column')) {
          try {
            hasEnsuredAppAuthTokenColumn = false;
            await ensureAppAuthTokenColumn(pool);
            await pool.query(
              `INSERT INTO users (id, name, email, phone, password_hash, app_auth_token, avatar_url, auth_provider, google_id, role)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), avatar_url = VALUES(avatar_url), google_id = VALUES(google_id), auth_provider = VALUES(auth_provider), app_auth_token = VALUES(app_auth_token)`,
              [
                created.id,
                created.name,
                created.email,
                created.phone || null,
                created.passwordHash || null,
                created.appAuthToken || null,
                created.avatarUrl || null,
                created.authProvider || 'email',
                created.googleId || null,
                created.role || 'customer'
              ]
            );
          } catch (retryErr) {
            console.warn('[UserRepo] MySQL insert user retry failed, saving to JSON:', retryErr);
          }
        } else {
          console.warn('[UserRepo] MySQL insert user failed, saving to JSON:', err);
        }
      }
    }

    const all = await readJson<StoredUser[]>(USERS_FILE, []);
    const existingIdx = all.findIndex(u => u.email.toLowerCase() === created.email.toLowerCase() || u.id === created.id);
    if (existingIdx >= 0) {
      all[existingIdx] = { ...all[existingIdx], ...created };
    } else {
      all.unshift(created);
    }
    await writeJson(USERS_FILE, all);
    return created;
  }

  static async update(id: string, updates: Partial<StoredUser>): Promise<StoredUser | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, id };

    const pool = getDbPool();
    if (pool) {
      try {
        await ensureAppAuthTokenColumn(pool);
        await pool.query(
          `UPDATE users SET name = ?, phone = ?, password_hash = ?, app_auth_token = ?, avatar_url = ?, google_id = ?, auth_provider = ?, updated_at = NOW() WHERE id = ?`,
          [
            merged.name,
            merged.phone || null,
            merged.passwordHash || null,
            merged.appAuthToken !== undefined ? merged.appAuthToken : (existing.appAuthToken || null),
            merged.avatarUrl || null,
            merged.googleId || null,
            merged.authProvider || 'email',
            id
          ]
        );
      } catch (err: any) {
        if (err?.code === 'ER_BAD_FIELD_ERROR' || err?.message?.includes('Unknown column')) {
          try {
            hasEnsuredAppAuthTokenColumn = false;
            await ensureAppAuthTokenColumn(pool);
            await pool.query(
              `UPDATE users SET name = ?, phone = ?, password_hash = ?, app_auth_token = ?, avatar_url = ?, google_id = ?, auth_provider = ?, updated_at = NOW() WHERE id = ?`,
              [
                merged.name,
                merged.phone || null,
                merged.passwordHash || null,
                merged.appAuthToken !== undefined ? merged.appAuthToken : (existing.appAuthToken || null),
                merged.avatarUrl || null,
                merged.googleId || null,
                merged.authProvider || 'email',
                id
              ]
            );
          } catch (retryErr) {
            console.warn('[UserRepo] MySQL update user retry failed:', retryErr);
          }
        } else {
          console.warn('[UserRepo] MySQL update user failed:', err);
        }
      }
    }

    const all = await readJson<StoredUser[]>(USERS_FILE, []);
    const idx = all.findIndex(u => u.id === id);
    if (idx >= 0) {
      all[idx] = merged;
      await writeJson(USERS_FILE, all);
    }
    return merged;
  }

  static async delete(id: string): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM user_addresses WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[UserRepo] MySQL delete user failed:', err);
      }
    }

    const allUsers = await readJson<StoredUser[]>(USERS_FILE, []);
    const filteredUsers = allUsers.filter(u => u.id !== id);
    await writeJson(USERS_FILE, filteredUsers);

    const allAddresses = await readJson<UserAddress[]>(ADDRESSES_FILE, []);
    const filteredAddresses = allAddresses.filter(a => a.userId !== id);
    await writeJson(ADDRESSES_FILE, filteredAddresses);

    return true;
  }

  // ----------------------------------------------------
  // ADDRESSES
  // ----------------------------------------------------

  static async getAddresses(userId: string): Promise<UserAddress[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query(
          'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
          [userId]
        );
        if (Array.isArray(rows)) {
          return rows.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            name: r.name,
            phone: r.phone,
            email: r.email || undefined,
            addressLine1: r.address_line1,
            addressLine2: r.address_line2 || undefined,
            landmark: r.landmark || undefined,
            city: r.city,
            state: r.state,
            pincode: r.pincode,
            isDefault: Boolean(r.is_default),
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          }));
        }
      } catch (err) {
        console.warn('[UserRepo] MySQL getAddresses failed, using JSON fallback:', err);
      }
    }
    const all = await readJson<UserAddress[]>(ADDRESSES_FILE, []);
    return all.filter(a => a.userId === userId);
  }

  static async saveAddress(userId: string, address: Partial<UserAddress>): Promise<UserAddress> {
    const id = address.id || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullAddress: UserAddress = {
      id,
      userId,
      name: address.name || 'Default Name',
      phone: address.phone || '',
      email: address.email || undefined,
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || undefined,
      landmark: address.landmark || undefined,
      city: address.city || 'Jalgaon',
      state: address.state || 'Maharashtra',
      pincode: address.pincode || '425001',
      isDefault: Boolean(address.isDefault),
      createdAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        if (fullAddress.isDefault) {
          await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }

        await pool.query(
          `INSERT INTO user_addresses (id, user_id, name, phone, email, address_line1, address_line2, landmark, city, state, pincode, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             name = VALUES(name), phone = VALUES(phone), email = VALUES(email),
             address_line1 = VALUES(address_line1), address_line2 = VALUES(address_line2),
             landmark = VALUES(landmark), city = VALUES(city), state = VALUES(state),
             pincode = VALUES(pincode), is_default = VALUES(is_default)`,
          [
            fullAddress.id,
            fullAddress.userId,
            fullAddress.name,
            fullAddress.phone,
            fullAddress.email || null,
            fullAddress.addressLine1,
            fullAddress.addressLine2 || null,
            fullAddress.landmark || null,
            fullAddress.city,
            fullAddress.state,
            fullAddress.pincode,
            fullAddress.isDefault ? 1 : 0
          ]
        );
      } catch (err) {
        console.warn('[UserRepo] MySQL saveAddress failed, saving to JSON fallback:', err);
      }
    }

    const all = await readJson<UserAddress[]>(ADDRESSES_FILE, []);
    if (fullAddress.isDefault) {
      all.forEach(a => {
        if (a.userId === userId) a.isDefault = false;
      });
    }

    const idx = all.findIndex(a => a.id === fullAddress.id);
    if (idx >= 0) {
      all[idx] = fullAddress;
    } else {
      all.unshift(fullAddress);
    }
    await writeJson(ADDRESSES_FILE, all);
    return fullAddress;
  }

  static async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
      } catch (err) {
        console.warn('[UserRepo] MySQL deleteAddress failed:', err);
      }
    }

    const all = await readJson<UserAddress[]>(ADDRESSES_FILE, []);
    const filtered = all.filter(a => !(a.id === addressId && a.userId === userId));
    await writeJson(ADDRESSES_FILE, filtered);
    return true;
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        await pool.query('UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [addressId, userId]);
      } catch (err) {
        console.warn('[UserRepo] MySQL setDefaultAddress failed:', err);
      }
    }

    const all = await readJson<UserAddress[]>(ADDRESSES_FILE, []);
    all.forEach(a => {
      if (a.userId === userId) {
        a.isDefault = a.id === addressId;
      }
    });
    await writeJson(ADDRESSES_FILE, all);
    return true;
  }

  static async purgeDummyUsers(): Promise<void> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query("DELETE FROM users WHERE email LIKE 'google_user_%' OR name LIKE 'google_user_%'");
      } catch (err) {
        console.warn('[UserRepo] MySQL purge dummy users failed:', err);
      }
    }
    const all = await readJson<StoredUser[]>(USERS_FILE, []);
    const filtered = all.filter(u => !u.email.startsWith('google_user_') && !u.name.startsWith('google_user_'));
    if (filtered.length !== all.length) {
      await writeJson(USERS_FILE, filtered);
    }
  }

  // ----------------------------------------------------
  // ADMIN & SUB-ADMIN STAFF MANAGEMENT
  // ----------------------------------------------------

  static async getStaffUsers(): Promise<any[]> {
    const [allUsers, allRoles] = await Promise.all([
      this.getAll(),
      AdminRoleRepository.getAll()
    ]);

    const roleMap = new Map(allRoles.map(r => [r.id.toLowerCase(), r]));

    const staffUsers = allUsers.filter(u => 
      u.email.toLowerCase() === SUPER_ADMIN_EMAIL ||
      u.isStaff === true ||
      u.role === 'super_admin' ||
      u.role === 'admin' ||
      u.role === 'sub_admin' ||
      (u.role && roleMap.has(u.role.toLowerCase()))
    );

    return staffUsers.map(u => {
      const isSuper = u.email.toLowerCase() === SUPER_ADMIN_EMAIL || u.role === 'super_admin';
      const assignedRole = u.role ? roleMap.get(u.role.toLowerCase()) : (isSuper ? roleMap.get('super_admin') : undefined);
      
      let effectivePermissions: PermissionKey[] = [];
      if (isSuper) {
        effectivePermissions = (roleMap.get('super_admin')?.permissions || []) as PermissionKey[];
      } else if (assignedRole) {
        const base = assignedRole.permissions || [];
        const custom = (u.customPermissions || []) as PermissionKey[];
        effectivePermissions = Array.from(new Set([...base, ...custom])) as PermissionKey[];
      } else {
        effectivePermissions = (u.customPermissions || []) as PermissionKey[];
      }

      const { passwordHash: _, ...safeUser } = u;
      return {
        ...safeUser,
        role: isSuper ? 'super_admin' : (u.role || 'sub_admin'),
        roleName: isSuper ? 'Super Admin' : (assignedRole ? assignedRole.name : 'Custom Staff'),
        roleColor: isSuper ? 'rose' : (assignedRole?.color || 'blue'),
        permissions: effectivePermissions,
        status: u.status || 'active',
        isSuperAdmin: isSuper
      };
    });
  }

  static async createStaffUser(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
    customPermissions?: PermissionKey[];
    status?: 'active' | 'inactive' | 'suspended';
  }): Promise<StoredUser> {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await this.findByEmail(cleanEmail);
    if (existing) {
      throw new Error(`A user with email "${cleanEmail}" already exists.`);
    }

    const created = await this.create({
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim(),
      passwordHash: data.password.trim(),
      role: data.role.toLowerCase(),
      isStaff: true,
      customPermissions: data.customPermissions || [],
      status: data.status || 'active',
      authProvider: 'email'
    });

    return created;
  }

  static async updateStaffUser(
    id: string,
    updates: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: string;
      customPermissions?: PermissionKey[];
      status?: 'active' | 'inactive' | 'suspended';
    }
  ): Promise<StoredUser | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const isSuper = existing.email.toLowerCase() === SUPER_ADMIN_EMAIL;

    const updatePayload: Partial<StoredUser> = {
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.phone !== undefined && { phone: updates.phone.trim() }),
      ...(updates.password !== undefined && updates.password.trim() !== '' && { passwordHash: updates.password.trim() }),
      ...(updates.customPermissions !== undefined && { customPermissions: updates.customPermissions })
    };

    // If not super admin, allow updating email, role and status
    if (!isSuper) {
      if (updates.email !== undefined) {
        updatePayload.email = updates.email.trim().toLowerCase();
      }
      if (updates.role !== undefined) {
        updatePayload.role = updates.role.toLowerCase();
      }
      if (updates.status !== undefined) {
        updatePayload.status = updates.status;
      }
    } else {
      // Keep super admin active and super_admin
      updatePayload.role = 'super_admin';
      updatePayload.status = 'active';
    }

    return this.update(id, updatePayload);
  }

  static async deleteStaffUser(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    if (existing.email.toLowerCase() === SUPER_ADMIN_EMAIL || existing.role === 'super_admin') {
      throw new Error('Primary Super Administrator cannot be deleted.');
    }
    return this.delete(id);
  }
}
