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
          'SELECT setting_key, setting_value FROM site_settings'
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const rowMap: Record<string, any> = {};
          for (const r of rows) {
            try {
              let parsed = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
              // If it was double-encoded as JSON string, parse once more
              if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('"') || parsed.startsWith('['))) {
                try { parsed = JSON.parse(parsed); } catch {}
              }
              rowMap[r.setting_key] = parsed;
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
            if (googleConf.googleClientId) result.googleClientId = String(googleConf.googleClientId).trim();
            if (googleConf.googleClientSecret) result.googleClientSecret = String(googleConf.googleClientSecret).trim();
            if (typeof googleConf.enableGoogleAuth === 'boolean') result.enableGoogleAuth = googleConf.enableGoogleAuth;
          }

          if (rowMap['razorpay_config']) {
            const rzpConf = rowMap['razorpay_config'];
            if (rzpConf.razorpayKeyId) result.razorpayKeyId = String(rzpConf.razorpayKeyId).trim();
            if (rzpConf.razorpayKeySecret) result.razorpayKeySecret = String(rzpConf.razorpayKeySecret).trim();
            if (typeof rzpConf.enableRazorpay === 'boolean') result.enableRazorpay = rzpConf.enableRazorpay;
          }

          if (rowMap['google_client_id'] !== undefined && rowMap['google_client_id'] !== null) {
            result.googleClientId = String(rowMap['google_client_id']).trim();
          }
          if (rowMap['google_client_secret'] !== undefined && rowMap['google_client_secret'] !== null) {
            result.googleClientSecret = String(rowMap['google_client_secret']).trim();
          }
          if (rowMap['razorpay_key_id'] !== undefined && rowMap['razorpay_key_id'] !== null) {
            result.razorpayKeyId = String(rowMap['razorpay_key_id']).trim();
          }
          if (rowMap['razorpay_key_secret'] !== undefined && rowMap['razorpay_key_secret'] !== null) {
            result.razorpayKeySecret = String(rowMap['razorpay_key_secret']).trim();
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
        await pool.query(`
          CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(128) PRIMARY KEY,
            setting_value LONGTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`ALTER TABLE site_settings MODIFY COLUMN setting_value LONGTEXT NOT NULL`).catch(() => {});

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

        const itemsToSave: [string, string][] = [
          ['general_settings', generalJson],
          ['google_auth_config', googleAuthJson],
          ['razorpay_config', razorpayJson],
          ['google_client_id', JSON.stringify((updated.googleClientId || '').trim())],
          ['google_client_secret', JSON.stringify((updated.googleClientSecret || '').trim())],
          ['razorpay_key_id', JSON.stringify((updated.razorpayKeyId || '').trim())],
          ['razorpay_key_secret', JSON.stringify((updated.razorpayKeySecret || '').trim())]
        ];

        for (const [sKey, sVal] of itemsToSave) {
          await pool.query(
            `INSERT INTO site_settings (setting_key, setting_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
            [sKey, sVal, sVal]
          );
        }
        console.log('[SettingsRepository] Successfully persisted updated site settings to MySQL database!');
      } catch (err: any) {
        console.error('[MySQL] CRITICAL error updating site_settings in DB:', err?.message || err);
        throw new Error(`Failed to persist settings into MySQL: ${err?.message || err}`);
      }
    }

    settingsMemoryCache = { data: updated, timestamp: Date.now() };
    return updated;
  }
}
