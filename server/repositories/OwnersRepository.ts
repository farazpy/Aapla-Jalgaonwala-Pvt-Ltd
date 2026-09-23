import { OwnerProfile } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const FILE_NAME = 'owners.json';

export const DEFAULT_OWNERS: OwnerProfile[] = [
  {
    id: 'owner_1',
    name: 'Faraz Khan',
    title: 'Founder & Managing Director',
    bio: 'Pioneering Khandeshi culinary heritage and authentic Jalgaon banana chips across India with stringent quality standards.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    location: 'Jalgaon & Pune',
    quote: 'Bringing the authentic aroma and taste of Jalgaon bananas to every home in India.',
    role: 'Founder & Visionary',
    socials: {
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com'
    }
  },
  {
    id: 'owner_2',
    name: 'Mahesh Patil',
    title: 'Co-Founder & Head of Production',
    bio: 'Overseeing authentic stone-grinding of masalas and traditional frying recipes rooted in Khandesh traditions.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    location: 'Jalgaon, Maharashtra',
    quote: 'Tradition is our recipe, purity is our commitment.',
    role: 'Master of Taste & Quality',
    socials: {
      linkedin: 'https://linkedin.com'
    }
  }
];

function parseSocials(val: any): Record<string, string> {
  if (!val) return {};
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return {};
}

export class OwnersRepository {
  static async getAll(): Promise<OwnerProfile[]> {
    return this.getOwners();
  }

  static async getOwners(): Promise<OwnerProfile[]> {
    try {
      const pool = getDbPool();
      if (pool) {
        try {
          const [rows]: any = await pool.query('SELECT * FROM owners ORDER BY id ASC');
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r: any) => ({
              id: String(r.id),
              name: r.name || '',
              title: r.title || '',
              bio: r.bio || '',
              photoUrl: r.photo_url || r.photoUrl || '',
              location: r.location || '',
              quote: r.quote || '',
              role: r.role || '',
              socials: parseSocials(r.socials)
            }));
          }
        } catch (err) {
          console.warn('[MySQL] Error querying owners, falling back to JSON:', err);
        }
      }

      const data = await readJson<OwnerProfile[]>(FILE_NAME, DEFAULT_OWNERS);
      if (!Array.isArray(data) || data.length === 0) {
        await writeJson(FILE_NAME, DEFAULT_OWNERS);
        return DEFAULT_OWNERS;
      }
      return data;
    } catch (err) {
      console.warn('[OwnersRepository] Error reading owners:', err);
      return DEFAULT_OWNERS;
    }
  }

  static async getById(id: string): Promise<OwnerProfile | null> {
    const list = await this.getOwners();
    return list.find(o => o.id === id) || null;
  }

  static async saveOwners(owners: OwnerProfile[]): Promise<OwnerProfile[]> {
    try {
      await writeJson(FILE_NAME, owners);
      const pool = getDbPool();
      if (pool) {
        try {
          for (const owner of owners) {
            await pool.query(
              `INSERT INTO owners (id, name, title, bio, photo_url, location, quote, role, socials)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               name=VALUES(name), title=VALUES(title), bio=VALUES(bio), photo_url=VALUES(photo_url),
               location=VALUES(location), quote=VALUES(quote), role=VALUES(role), socials=VALUES(socials)`,
              [
                owner.id,
                owner.name || '',
                owner.title || '',
                owner.bio || '',
                owner.photoUrl || '',
                owner.location || '',
                owner.quote || '',
                owner.role || '',
                JSON.stringify(owner.socials || {})
              ]
            );
          }
        } catch (err) {
          console.warn('[MySQL] Error saving owners to database:', err);
        }
      }
    } catch (err) {
      console.warn('[OwnersRepository] Error saving owners:', err);
    }
    return owners;
  }

  static async create(owner: Omit<OwnerProfile, 'id'> & { id?: string }): Promise<OwnerProfile> {
    return this.addOwner(owner);
  }

  static async addOwner(owner: Omit<OwnerProfile, 'id'> & { id?: string }): Promise<OwnerProfile> {
    const current = await this.getOwners();
    const newOwner: OwnerProfile = {
      id: owner.id || `owner_${Date.now()}`,
      name: owner.name || 'Owner',
      title: owner.title || 'Managing Partner',
      bio: owner.bio || '',
      photoUrl: owner.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      location: owner.location || 'Jalgaon',
      quote: owner.quote || '',
      role: owner.role || 'Leadership',
      socials: owner.socials || {}
    };
    const updated = [...current, newOwner];
    await this.saveOwners(updated);
    return newOwner;
  }

  static async update(id: string, updateData: Partial<OwnerProfile>): Promise<OwnerProfile | null> {
    return this.updateOwner(id, updateData);
  }

  static async updateOwner(id: string, updateData: Partial<OwnerProfile>): Promise<OwnerProfile | null> {
    const current = await this.getOwners();
    const idx = current.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    current[idx] = { ...current[idx], ...updateData };
    await this.saveOwners(current);
    return current[idx];
  }

  static async delete(id: string): Promise<boolean> {
    return this.deleteOwner(id);
  }

  static async deleteOwner(id: string): Promise<boolean> {
    const current = await this.getOwners();
    const filtered = current.filter((o) => o.id !== id);
    if (filtered.length === current.length) return false;
    await this.saveOwners(filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM owners WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[MySQL] Error deleting owner from database:', err);
      }
    }
    return true;
  }
}
