import fs from 'fs';
import path from 'path';
import { getDbPool } from '../database/connection';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { systemCache } from '../utils/cache';

export interface DomainScanResult {
  currentDomain: string;
  currentHost: string;
  totalMatches: number;
  tables: Array<{
    table: string;
    column: string;
    count: number;
    samples: string[];
  }>;
  jsonFiles: Array<{
    filename: string;
    count: number;
  }>;
}

export interface DomainReplaceResult {
  success: boolean;
  message: string;
  currentDomain: string;
  newDomain: string;
  totalReplaced: number;
  tablesUpdated: Array<{
    table: string;
    column: string;
    rowsAffected: number;
  }>;
  jsonFilesUpdated: string[];
  samples: Array<{
    table: string;
    column: string;
    before: string;
    after: string;
  }>;
}

export class S3DomainReplacementService {
  /**
   * Normalizes an input domain into protocol, host, and clean base URL.
   */
  static normalizeDomain(inputDomain: string, defaultProtocol = 'https:'): { host: string; protocol: string; baseUrl: string } {
    let clean = (inputDomain || '').trim();
    if (!clean) {
      clean = 'https://s3.htknetwork.in';
    }

    // Add protocol if missing
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `${defaultProtocol}//${clean}`;
    }

    try {
      const parsed = new URL(clean);
      const protocol = parsed.protocol || defaultProtocol;
      const host = parsed.host;
      const baseUrl = `${protocol}//${host}`;
      return { host, protocol, baseUrl };
    } catch {
      // Fallback regex extraction
      const match = clean.match(/^(https?:\/\/)?([^/:]+)/i);
      const host = match ? match[2] : clean.replace(/^(https?:\/\/)?/, '').split('/')[0];
      const protocol = clean.startsWith('http://') ? 'http:' : 'https:';
      return { host, protocol, baseUrl: `${protocol}//${host}` };
    }
  }

  /**
   * Scans all MySQL tables and JSON files for occurrences of the specified S3 base domain.
   */
  static async scanDomain(currentDomainInput?: string): Promise<DomainScanResult> {
    const { host: currentHost, baseUrl: currentDomain } = this.normalizeDomain(currentDomainInput || 'https://s3.htknetwork.in');
    const pool = getDbPool();

    const tableMatches: DomainScanResult['tables'] = [];
    let totalMatches = 0;

    if (pool) {
      try {
        const [tables]: any = await pool.query('SHOW TABLES');
        const tableNames = tables.map((t: any) => Object.values(t)[0] as string);

        for (const tableName of tableNames) {
          try {
            const [cols]: any = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
            for (const c of cols) {
              const colName = c.Field;
              const type = String(c.Type || '').toLowerCase();
              if (
                type.includes('char') ||
                type.includes('text') ||
                type.includes('json') ||
                type.includes('blob')
              ) {
                const [countRows]: any = await pool.query(
                  `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE \`${colName}\` LIKE ?`,
                  [`%${currentHost}%`]
                );
                const count = Number(countRows[0]?.count || 0);
                if (count > 0) {
                  totalMatches += count;
                  const [sampleRows]: any = await pool.query(
                    `SELECT \`${colName}\` as val FROM \`${tableName}\` WHERE \`${colName}\` LIKE ? LIMIT 3`,
                    [`%${currentHost}%`]
                  );
                  const samples = (sampleRows || [])
                    .map((r: any) => {
                      const v = String(r.val || '');
                      // If JSON, extract URL snippet
                      if (v.startsWith('{') || v.startsWith('[')) {
                        const m = v.match(/https?:\/\/[^"'\s]+/);
                        return m ? m[0] : v.substring(0, 80);
                      }
                      return v;
                    })
                    .filter(Boolean);

                  tableMatches.push({
                    table: tableName,
                    column: colName,
                    count,
                    samples
                  });
                }
              }
            }
          } catch (colErr) {
            console.warn(`[S3DomainScanner] Error scanning table ${tableName}:`, colErr);
          }
        }
      } catch (err) {
        console.error('[S3DomainScanner] Error scanning MySQL tables:', err);
      }
    }

    // Also scan JSON files in server/data
    const jsonFiles: DomainScanResult['jsonFiles'] = [];
    const dataDir = path.join(process.cwd(), 'server', 'data');
    if (fs.existsSync(dataDir)) {
      try {
        const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
        for (const file of files) {
          try {
            const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
            const occurrences = (content.match(new RegExp(currentHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (occurrences > 0) {
              jsonFiles.push({ filename: file, count: occurrences });
            }
          } catch {}
        }
      } catch {}
    }

    return {
      currentDomain,
      currentHost,
      totalMatches,
      tables: tableMatches,
      jsonFiles
    };
  }

  /**
   * Replaces all occurrences of currentDomain with newDomain in MySQL database and JSON storage files,
   * keeping the paths (/f/{file_id}) identical.
   */
  static async replaceDomain(
    currentDomainInput: string,
    newDomainInput: string,
    options: { updateUploadEndpoint?: boolean } = {}
  ): Promise<DomainReplaceResult> {
    const current = this.normalizeDomain(currentDomainInput || 'https://s3.htknetwork.in');
    const target = this.normalizeDomain(newDomainInput);

    if (!target.host) {
      throw new Error('Please enter a valid replacement domain URL (e.g. https://s3.yourcustomdomain.com)');
    }

    if (current.host.toLowerCase() === target.host.toLowerCase()) {
      throw new Error(`Current domain (${current.host}) and new domain (${target.host}) are identical. Nothing to replace.`);
    }

    const pool = getDbPool();
    const tablesUpdated: DomainReplaceResult['tablesUpdated'] = [];
    const samples: DomainReplaceResult['samples'] = [];
    let totalReplaced = 0;

    const currentHost = current.host;
    const newHost = target.host;
    const newBaseUrl = target.baseUrl;

    if (pool) {
      // 1. Gather all tables and text/json/varchar columns
      const [tables]: any = await pool.query('SHOW TABLES');
      const tableNames = tables.map((t: any) => Object.values(t)[0] as string);

      for (const tableName of tableNames) {
        try {
          const [cols]: any = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
          for (const c of cols) {
            const colName = c.Field;
            const type = String(c.Type || '').toLowerCase();
            if (
              type.includes('char') ||
              type.includes('text') ||
              type.includes('json') ||
              type.includes('blob')
            ) {
              // Collect a sample before replacement if rows match
              const [sampleBeforeRows]: any = await pool.query(
                `SELECT \`${colName}\` as val FROM \`${tableName}\` WHERE \`${colName}\` LIKE ? LIMIT 1`,
                [`%${currentHost}%`]
              );

              if (sampleBeforeRows.length > 0) {
                const sampleVal = String(sampleBeforeRows[0].val || '');

                // Perform SQL replacement for https, http, and protocol-relative links
                const [updateResult]: any = await pool.query(
                  `UPDATE \`${tableName}\`
                   SET \`${colName}\` = REPLACE(
                     REPLACE(
                       REPLACE(\`${colName}\`, ?, ?),
                       ?, ?
                     ),
                     ?, ?
                   )
                   WHERE \`${colName}\` LIKE ?`,
                  [
                    `https://${currentHost}`, `${newBaseUrl}`,
                    `http://${currentHost}`, `${newBaseUrl}`,
                    `//${currentHost}`, `//${newHost}`,
                    `%${currentHost}%`
                  ]
                );

                const affected = updateResult?.affectedRows || 0;
                if (affected > 0) {
                  totalReplaced += affected;
                  tablesUpdated.push({
                    table: tableName,
                    column: colName,
                    rowsAffected: affected
                  });

                  // Create clean before & after sample representation
                  const beforeUrlMatch = sampleVal.match(/https?:\/\/[^"'\s]+/) || [sampleVal];
                  const beforeStr = beforeUrlMatch[0];
                  const afterStr = beforeStr.replace(new RegExp(`https?://${currentHost}`, 'g'), newBaseUrl);

                  samples.push({
                    table: tableName,
                    column: colName,
                    before: beforeStr,
                    after: afterStr
                  });
                }
              }
            }
          }
        } catch (tableErr) {
          console.warn(`[S3DomainReplacer] Notice processing table ${tableName}:`, tableErr);
        }
      }
    }

    // 2. Also update SettingsRepository (general_settings in MySQL, settings.json, in-memory cache)
    try {
      const currentSettings = await SettingsRepository.get();
      const settingsUpdates: Record<string, any> = {};

      const replaceUrl = (val?: string) => {
        if (!val || typeof val !== 'string') return val;
        return val
          .replace(new RegExp(`https?://${currentHost}`, 'g'), newBaseUrl)
          .replace(new RegExp(`//${currentHost}`, 'g'), `//${newHost}`);
      };

      if (currentSettings.appLogo) settingsUpdates.appLogo = replaceUrl(currentSettings.appLogo);
      if (currentSettings.faviconUrl) settingsUpdates.faviconUrl = replaceUrl(currentSettings.faviconUrl);
      if (currentSettings.faviconSvgUrl) settingsUpdates.faviconSvgUrl = replaceUrl(currentSettings.faviconSvgUrl);
      if (currentSettings.faviconIcoUrl) settingsUpdates.faviconIcoUrl = replaceUrl(currentSettings.faviconIcoUrl);
      if (currentSettings.appleTouchIconUrl) settingsUpdates.appleTouchIconUrl = replaceUrl(currentSettings.appleTouchIconUrl);
      if (currentSettings.siteWebmanifestUrl) settingsUpdates.siteWebmanifestUrl = replaceUrl(currentSettings.siteWebmanifestUrl);
      if (currentSettings.heroCardImage) settingsUpdates.heroCardImage = replaceUrl(currentSettings.heroCardImage);
      if (currentSettings.defaultUserAvatar) settingsUpdates.defaultUserAvatar = replaceUrl(currentSettings.defaultUserAvatar);
      if (currentSettings.ourStoryHeroImageUrl) settingsUpdates.ourStoryHeroImageUrl = replaceUrl(currentSettings.ourStoryHeroImageUrl);

      // Optionally update teleCloudEndpoint domain if requested (default true)
      if (options.updateUploadEndpoint !== false && currentSettings.teleCloudEndpoint?.includes(currentHost)) {
        settingsUpdates.teleCloudEndpoint = replaceUrl(currentSettings.teleCloudEndpoint);
      }

      await SettingsRepository.update(settingsUpdates);
      console.log('[S3DomainReplacer] Updated settings repository with new domain:', newBaseUrl);
    } catch (settingsErr) {
      console.error('[S3DomainReplacer] Error updating SettingsRepository:', settingsErr);
    }

    // 3. Update JSON fallback files on disk
    const jsonFilesUpdated: string[] = [];
    const dataDir = path.join(process.cwd(), 'server', 'data');
    if (fs.existsSync(dataDir)) {
      try {
        const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
        for (const file of files) {
          try {
            const filePath = path.join(dataDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            if (content.includes(currentHost)) {
              const updatedContent = content
                .replace(new RegExp(`https://${currentHost}`, 'g'), newBaseUrl)
                .replace(new RegExp(`http://${currentHost}`, 'g'), newBaseUrl)
                .replace(new RegExp(`//${currentHost}`, 'g'), `//${newHost}`);
              fs.writeFileSync(filePath, updatedContent, 'utf-8');
              jsonFilesUpdated.push(file);
            }
          } catch (fileErr) {
            console.warn(`[S3DomainReplacer] Notice updating file ${file}:`, fileErr);
          }
        }
      } catch {}
    }

    // 4. Flush all repository & system caches
    SettingsRepository.clearCache();
    ProductRepository.clearCache();
    CategoryRepository.clearCache();
    systemCache.flush();

    return {
      success: true,
      message: `Successfully replaced ${current.baseUrl} with ${target.baseUrl} across ${totalReplaced} records in MySQL database.`,
      currentDomain: current.baseUrl,
      newDomain: target.baseUrl,
      totalReplaced,
      tablesUpdated,
      jsonFilesUpdated,
      samples: samples.slice(0, 10)
    };
  }
}
