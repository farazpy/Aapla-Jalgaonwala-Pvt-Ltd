import { WomanGraphicPost, initialWomanGraphics } from '../data/initialWomanGraphics';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const FILE_NAME = 'woman_graphics.json';

export class WomanGraphicsRepository {
  static async getAll(): Promise<WomanGraphicPost[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS woman_graphics (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255),
            caption TEXT,
            image_url TEXT NOT NULL,
            public_id VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Clean up legacy dummy IDs if present
        await pool.query("DELETE FROM woman_graphics WHERE id IN ('wg_1', 'wg_2')").catch(() => {});

        const [rows]: any = await pool.query('SELECT * FROM woman_graphics ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          return rows.map((r: any) => ({
            id: r.id,
            title: r.title || 'Woman Graphic',
            caption: r.caption || '',
            imageUrl: r.image_url || r.imageUrl,
            publicId: r.public_id || r.publicId || '',
            createdAt: r.created_at || r.createdAt || new Date().toISOString()
          }));
        }
      } catch (err) {
        console.warn('[WomanGraphicsRepository] MySQL query error:', err);
      }
    }
    const jsonPosts = await readJson<WomanGraphicPost[]>(FILE_NAME, []);
    return (jsonPosts || []).filter(p => p.id !== 'wg_1' && p.id !== 'wg_2');
  }

  static async saveAll(posts: WomanGraphicPost[]): Promise<WomanGraphicPost[]> {
    await writeJson(FILE_NAME, posts);
    const pool = getDbPool();
    if (pool) {
      try {
        // Ensure table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS woman_graphics (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255),
            caption TEXT,
            image_url TEXT NOT NULL,
            public_id VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        for (const post of posts) {
          await pool.query(
            `INSERT INTO woman_graphics (id, title, caption, image_url, public_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             title=VALUES(title), caption=VALUES(caption), image_url=VALUES(image_url), public_id=VALUES(public_id)`,
            [
              post.id,
              post.title || '',
              post.caption || '',
              post.imageUrl,
              post.publicId || '',
              post.createdAt ? new Date(post.createdAt) : new Date()
            ]
          );
        }
      } catch (err) {
        console.warn('[MySQL] Error syncing woman_graphics table:', err);
      }
    }
    return posts;
  }

  static async addPost(data: Omit<WomanGraphicPost, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<WomanGraphicPost> {
    const current = await this.getAll();
    const newPost: WomanGraphicPost = {
      id: data.id || `wg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: data.title || 'Woman Partner Graphic',
      caption: data.caption || '',
      imageUrl: data.imageUrl,
      publicId: data.publicId || '',
      createdAt: data.createdAt || new Date().toISOString()
    };

    const updated = [newPost, ...current];
    await this.saveAll(updated);
    return newPost;
  }

  static async addMultiplePosts(items: Array<{ title?: string; caption?: string; imageUrl: string; publicId?: string }>): Promise<WomanGraphicPost[]> {
    const current = await this.getAll();
    const newPosts: WomanGraphicPost[] = items.map((item, idx) => ({
      id: `wg_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      title: item.title || `Graphic Post #${current.length + idx + 1}`,
      caption: item.caption || '',
      imageUrl: item.imageUrl,
      publicId: item.publicId || '',
      createdAt: new Date().toISOString()
    }));

    const updated = [...newPosts, ...current];
    await this.saveAll(updated);
    return newPosts;
  }

  static async deletePost(id: string): Promise<boolean> {
    const current = await this.getAll();
    const filtered = current.filter((p) => p.id !== id);
    if (filtered.length === current.length) return false;

    await writeJson(FILE_NAME, filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM woman_graphics WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[MySQL] Error deleting from woman_graphics table:', err);
      }
    }
    return true;
  }

  static async updatePost(id: string, updates: Partial<WomanGraphicPost>): Promise<WomanGraphicPost | null> {
    const current = await this.getAll();
    const idx = current.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    current[idx] = { ...current[idx], ...updates };
    await this.saveAll(current);
    return current[idx];
  }
}
