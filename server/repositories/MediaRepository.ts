import { GalleryItem, VideoItem } from '@/types';
import { initialGalleryItems, initialVideoItems } from '@/data/media';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { addCloudinaryOriginalFlag } from '../utils/cloudinary';

const GALLERY_FILE = 'gallery.json';
const VIDEOS_FILE = 'videos.json';

export class MediaRepository {
  // Gallery Media
  static async getGallery(): Promise<GalleryItem[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM gallery_media ORDER BY id ASC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            categoryLabel: r.category_label || r.categoryLabel,
            imgUrl: r.img_url || r.imgUrl,
            caption: r.caption,
            date: r.date,
            location: r.location
          }));
        }
      } catch (err) {
        console.warn('[MySQL] Error querying gallery_media, using JSON fallback:', err);
      }
    }
    return readJson<GalleryItem[]>(GALLERY_FILE, initialGalleryItems);
  }

  static async saveGallery(items: GalleryItem[]): Promise<GalleryItem[]> {
    await writeJson(GALLERY_FILE, items);
    const pool = getDbPool();
    if (pool) {
      try {
        for (const item of items) {
          const rawImgUrl = item.imgUrl || (item as any).imageUrl || (item as any).url || (item as any).img_url || '';
          const resolvedImgUrl = addCloudinaryOriginalFlag(rawImgUrl);
          await pool.query(
            `INSERT INTO gallery_media (id, title, category, category_label, img_url, caption, date, location)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             title=VALUES(title), category=VALUES(category), category_label=VALUES(category_label),
             img_url=VALUES(img_url), caption=VALUES(caption), date=VALUES(date), location=VALUES(location)`,
            [
              item.id || `g_${Date.now()}`,
              item.title || '',
              item.category || '',
              item.categoryLabel || '',
              resolvedImgUrl,
              item.caption || '',
              item.date || '',
              item.location || ''
            ]
          );
        }
      } catch (err) {
        console.warn('[MySQL] Error saving gallery item to database:', err);
      }
    }
    return items;
  }

  static async addGalleryItem(item: Omit<GalleryItem, 'id'> & { id?: string; url?: string; imageUrl?: string }): Promise<GalleryItem> {
    const current = await this.getGallery();
    const rawImgUrl = item.imgUrl || item.imageUrl || item.url || (item as any).img_url || '';
    const resolvedImgUrl = addCloudinaryOriginalFlag(rawImgUrl);
    const newItem: GalleryItem = {
      ...item,
      id: item.id || `g_${Date.now()}`,
      title: item.title || 'Untitled Image',
      category: item.category || 'general',
      categoryLabel: item.categoryLabel || '',
      imgUrl: resolvedImgUrl,
      caption: item.caption || '',
      date: item.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      location: item.location || ''
    };
    const updated = [newItem, ...current];
    await this.saveGallery(updated);
    return newItem;
  }

  static async updateGalleryItem(id: string, updateData: Partial<GalleryItem>): Promise<GalleryItem | null> {
    const current = await this.getGallery();
    const idx = current.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    current[idx] = { ...current[idx], ...updateData };
    await this.saveGallery(current);
    return current[idx];
  }

  static async deleteGalleryItem(id: string): Promise<boolean> {
    const current = await this.getGallery();
    const filtered = current.filter((i) => i.id !== id);
    if (filtered.length === current.length) return false;
    await this.saveGallery(filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM gallery_media WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[MySQL] Error deleting gallery item from DB:', err);
      }
    }
    return true;
  }

  // Video Showcase
  static async getVideos(): Promise<VideoItem[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM video_media ORDER BY id ASC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            duration: r.duration,
            thumbnail: r.thumbnail,
            videoUrl: r.video_url || r.videoUrl,
            description: r.description,
            category: r.category,
            speaker: r.speaker
          }));
        }
      } catch (err) {
        console.warn('[MySQL] Error querying video_media, using JSON fallback:', err);
      }
    }
    return readJson<VideoItem[]>(VIDEOS_FILE, initialVideoItems);
  }

  static async saveVideos(videos: VideoItem[]): Promise<VideoItem[]> {
    await writeJson(VIDEOS_FILE, videos);
    const pool = getDbPool();
    if (pool) {
      try {
        for (const video of videos) {
          await pool.query(
            `INSERT INTO video_media (id, title, duration, thumbnail, video_url, description, category, speaker)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             title=VALUES(title), duration=VALUES(duration), thumbnail=VALUES(thumbnail),
             video_url=VALUES(video_url), description=VALUES(description),
             category=VALUES(category), speaker=VALUES(speaker)`,
            [
              video.id,
              video.title,
              video.duration,
              video.thumbnail,
              video.videoUrl,
              video.description,
              video.category,
              video.speaker
            ]
          );
        }
      } catch (err) {
        console.warn('[MySQL] Error saving video to database:', err);
      }
    }
    return videos;
  }

  static async addVideo(video: Omit<VideoItem, 'id'> & { id?: string }): Promise<VideoItem> {
    const current = await this.getVideos();
    const newVid: VideoItem = {
      ...video,
      id: video.id || `v_${Date.now()}`
    };
    const updated = [newVid, ...current];
    await this.saveVideos(updated);
    return newVid;
  }

  static async updateVideo(id: string, updateData: Partial<VideoItem>): Promise<VideoItem | null> {
    const current = await this.getVideos();
    const idx = current.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    current[idx] = { ...current[idx], ...updateData };
    await this.saveVideos(current);
    return current[idx];
  }

  static async deleteVideo(id: string): Promise<boolean> {
    const current = await this.getVideos();
    const filtered = current.filter((v) => v.id !== id);
    if (filtered.length === current.length) return false;
    await this.saveVideos(filtered);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM video_media WHERE id = ?', [id]);
      } catch (err) {
        console.warn('[MySQL] Error deleting video from DB:', err);
      }
    }
    return true;
  }

  // Unified media accessors for /api/media
  static async getAll(): Promise<{ gallery: GalleryItem[]; videos: VideoItem[] }> {
    const [gallery, videos] = await Promise.all([
      this.getGallery(),
      this.getVideos()
    ]);
    return { gallery, videos };
  }

  static async create(item: any): Promise<GalleryItem | VideoItem> {
    if (item.videoUrl || item.duration || item.type === 'video') {
      return this.addVideo(item);
    }
    return this.addGalleryItem(item);
  }

  static async delete(id: string): Promise<boolean> {
    const galleryDeleted = await this.deleteGalleryItem(id);
    const videoDeleted = await this.deleteVideo(id);
    return galleryDeleted || videoDeleted;
  }
}
