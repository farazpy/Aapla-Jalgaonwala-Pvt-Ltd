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

    const jsonFallback = await readJson<SiteSettings>(FILE_NAME, initialSiteSettings);
    let result: SiteSettings = { ...initialSiteSettings, ...jsonFallback };

    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ("general_settings", "google_auth_config", "razorpay_config")'
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const rowMap: Record<string, any> = {};
          for (const r of rows) {
            try {
              rowMap[r.setting_key] = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
            } catch {
              rowMap[r.setting_key] = r.setting_value;
            }
          }

          if (rowMap['general_settings']) {
            const general = rowMap['general_settings'];
            if (general.heroSecondaryCtaText === 'Our Story') {
              general.heroSecondaryCtaText = 'Woman Partner Registration';
              general.heroSecondaryCtaLink = '/partner-program';
            }
            result = { ...result, ...general };
          }

          if (rowMap['google_auth_config']) {
            const googleConf = rowMap['google_auth_config'];
            if (googleConf.googleClientId) result.googleClientId = googleConf.googleClientId;
            if (googleConf.googleClientSecret) result.googleClientSecret = googleConf.googleClientSecret;
            if (typeof googleConf.enableGoogleAuth === 'boolean') result.enableGoogleAuth = googleConf.enableGoogleAuth;
          }

          if (rowMap['razorpay_config']) {
            const rzpConf = rowMap['razorpay_config'];
            if (rzpConf.razorpayKeyId) result.razorpayKeyId = rzpConf.razorpayKeyId;
            if (rzpConf.razorpayKeySecret) result.razorpayKeySecret = rzpConf.razorpayKeySecret;
            if (typeof rzpConf.enableRazorpay === 'boolean') result.enableRazorpay = rzpConf.enableRazorpay;
          }
        }
      } catch (err: any) {
        if (err?.code !== 'ER_NO_SUCH_TABLE' && !err?.message?.includes("doesn't exist")) {
          console.warn('[MySQL] Error querying site_settings, using fallback:', err?.message || err);
        }
      }
    }

    // Ensure fallback to environment variables if still unconfigured
    if (!result.googleClientId && (process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID)) {
      result.googleClientId = (process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '').trim();
    }
    if (!result.googleClientSecret && (process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET)) {
      result.googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || '').trim();
    }
    if (!result.razorpayKeyId && (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)) {
      result.razorpayKeyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
    }
    if (!result.razorpayKeySecret && process.env.RAZORPAY_KEY_SECRET) {
      result.razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    }

    settingsMemoryCache = { data: result, timestamp: Date.now() };
    return result;
  }

  static async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    this.clearCache();
    const current = await this.getSettings();

    // Preserve existing secrets if empty or whitespace-only is submitted
    const cleanedSettings = { ...settings };
    if (cleanedSettings.razorpayKeySecret === '' && current.razorpayKeySecret) {
      cleanedSettings.razorpayKeySecret = current.razorpayKeySecret;
    }
    if (cleanedSettings.googleClientSecret === '' && current.googleClientSecret) {
      cleanedSettings.googleClientSecret = current.googleClientSecret;
    }
    if (cleanedSettings.smtpPass === '' && current.smtpPass) {
      cleanedSettings.smtpPass = current.smtpPass;
    }
    if (cleanedSettings.cloudinaryApiSecret === '' && current.cloudinaryApiSecret) {
      cleanedSettings.cloudinaryApiSecret = current.cloudinaryApiSecret;
    }
    if (cleanedSettings.telegramBotToken === '' && current.telegramBotToken) {
      cleanedSettings.telegramBotToken = current.telegramBotToken;
    }

    const updated = { ...current, ...cleanedSettings };

    // Sanitize image URLs
    if (updated.appLogo) updated.appLogo = addCloudinaryOriginalFlag(updated.appLogo);
    if (updated.ourStoryHeroImageUrl) updated.ourStoryHeroImageUrl = addCloudinaryOriginalFlag(updated.ourStoryHeroImageUrl);
    if (updated.faviconIcoUrl) updated.faviconIcoUrl = addCloudinaryOriginalFlag(updated.faviconIcoUrl);
    if (updated.appleTouchIconUrl) updated.appleTouchIconUrl = addCloudinaryOriginalFlag(updated.appleTouchIconUrl);

    // Save to durable JSON file
    await writeJson(FILE_NAME, updated);

    // Save to MySQL site_settings table
    const pool = getDbPool();
    if (pool) {
      try {
        const generalJson = JSON.stringify(updated);
        const googleAuthJson = JSON.stringify({
          googleClientId: (updated.googleClientId || '').trim(),
          googleClientSecret: (updated.googleClientSecret || '').trim(),
          enableGoogleAuth: updated.enableGoogleAuth !== false
        });
        const razorpayJson = JSON.stringify({
          razorpayKeyId: (updated.razorpayKeyId || '').trim(),
          razorpayKeySecret: (updated.razorpayKeySecret || '').trim(),
          enableRazorpay: updated.enableRazorpay !== false
        });

        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value)
           VALUES ('general_settings', ?), ('google_auth_config', ?), ('razorpay_config', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [generalJson, googleAuthJson, razorpayJson]
        );
      } catch (err) {
        console.warn('[MySQL] Error updating site_settings in DB:', err);
      }
    }

    settingsMemoryCache = { data: updated, timestamp: Date.now() };
    return updated;
  }
}
