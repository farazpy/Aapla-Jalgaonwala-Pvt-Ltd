import { SiteSettings } from '@/types';
import { initialSiteSettings } from '@/data/settings';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';
import { addCloudinaryOriginalFlag } from '../utils/cloudinary';

const FILE_NAME = 'settings.json';

let settingsMemoryCache: { data: SiteSettings; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000;

export class SettingsRepository {
  static clearCache() {
    settingsMemoryCache = null;
  }

  static async get(): Promise<SiteSettings> {
    return this.getSettings();
  }

  static async update(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.updateSettings(settings);
  }

  static async getSettings(): Promise<SiteSettings> {
    if (settingsMemoryCache && (Date.now() - settingsMemoryCache.timestamp < CACHE_TTL_MS)) {
      return settingsMemoryCache.data;
    }

    const pool = getDbPool();
    let result: SiteSettings = initialSiteSettings;

    if (pool) {
      try {
        const [rows]: any = await pool.query('SELECT setting_value FROM site_settings WHERE setting_key = "general_settings" LIMIT 1');
        if (Array.isArray(rows) && rows.length > 0 && rows[0].setting_value) {
          const val = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
          if (val.heroSecondaryCtaText === 'Our Story') {
            val.heroSecondaryCtaText = 'Woman Partner Registration';
            val.heroSecondaryCtaLink = '/partner-program';
          }
          result = { ...initialSiteSettings, ...val };
          settingsMemoryCache = { data: result, timestamp: Date.now() };
          return result;
        }
      } catch (err: any) {
        if (err?.code !== 'ER_NO_SUCH_TABLE' && !err?.message?.includes("doesn't exist")) {
          console.warn('[MySQL] Error querying site_settings, using JSON fallback:', err?.message || err);
        }
      }
    }

    result = await readJson<SiteSettings>(FILE_NAME, initialSiteSettings);
    settingsMemoryCache = { data: result, timestamp: Date.now() };
    return result;
  }

  static async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    this.clearCache();
    const current = await this.getSettings();
    const updated = { ...current, ...settings };

    // Sanitize image URLs
    if (updated.appLogo) updated.appLogo = addCloudinaryOriginalFlag(updated.appLogo);
    if (updated.ourStoryHeroImageUrl) updated.ourStoryHeroImageUrl = addCloudinaryOriginalFlag(updated.ourStoryHeroImageUrl);
    if (updated.faviconIcoUrl) updated.faviconIcoUrl = addCloudinaryOriginalFlag(updated.faviconIcoUrl);
    if (updated.appleTouchIconUrl) updated.appleTouchIconUrl = addCloudinaryOriginalFlag(updated.appleTouchIconUrl);

    await writeJson(FILE_NAME, updated);

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value)
           VALUES ('general_settings', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [JSON.stringify(updated)]
        );
      } catch (err) {
        console.warn('[MySQL] Error updating site_settings in DB:', err);
      }
    }
    settingsMemoryCache = { data: updated, timestamp: Date.now() };
    return updated;
  }
}
