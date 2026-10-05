import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { uploadToCloudinary, isCloudinaryConfiguredAsync } from './cloudinary';
import { uploadToTeleCloud, isTeleCloudConfiguredAsync } from './telecloud';
import { SettingsRepository } from '../repositories/SettingsRepository';

export interface FaviconFileInfo {
  key: string;
  filename: string;
  path: string;
  exists: boolean;
  size: number;
  updatedAt: string | null;
  dimensions?: string;
  type: string;
  tagSnippet: string;
}

export interface FaviconSuiteStatus {
  favicon96: FaviconFileInfo;
  faviconSvg: FaviconFileInfo;
  faviconIco: FaviconFileInfo;
  appleTouchIcon: FaviconFileInfo;
  siteWebmanifest: FaviconFileInfo & { manifestContent?: any };
  mobileWebAppTitle: string;
  htmlSnippet: string;
  allFilesExist: boolean;
  lastModifiedOverall: string | null;
}

const FAVICONS_PUBLIC_DIR = path.join(process.cwd(), 'public', 'favicons');
const FAVICONS_DIST_DIR = path.join(process.cwd(), 'dist', 'favicons');

export function ensureFaviconsDirectory() {
  if (!fs.existsSync(FAVICONS_PUBLIC_DIR)) {
    fs.mkdirSync(FAVICONS_PUBLIC_DIR, { recursive: true });
  }
}

function syncToDist(filename: string, buffer: Buffer | string) {
  try {
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      if (!fs.existsSync(FAVICONS_DIST_DIR)) {
        fs.mkdirSync(FAVICONS_DIST_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(FAVICONS_DIST_DIR, filename), buffer);
    }
  } catch (e) {
    console.warn(`[FaviconManager] Notice syncing ${filename} to dist:`, e);
  }
}

// Map a filename to the SettingsRepository database field
function getSettingsFieldForFavicon(filename: string): string {
  switch (filename) {
    case 'favicon-96x96.png':
      return 'faviconUrl';
    case 'favicon.svg':
      return 'faviconSvgUrl';
    case 'favicon.ico':
      return 'faviconIcoUrl';
    case 'apple-touch-icon.png':
      return 'appleTouchIconUrl';
    case 'site.webmanifest':
      return 'siteWebmanifestUrl';
    default:
      return '';
  }
}

export async function getFaviconSuiteStatus(mobileTitle: string = 'AJW'): Promise<FaviconSuiteStatus> {
  ensureFaviconsDirectory();

  const settings = await SettingsRepository.get();

  const faviconUrl = settings.faviconUrl || '/favicons/favicon-96x96.png';
  const faviconSvgUrl = settings.faviconSvgUrl || '/favicons/favicon.svg';
  const faviconIcoUrl = settings.faviconIcoUrl || '/favicons/favicon.ico';
  const appleTouchIconUrl = settings.appleTouchIconUrl || '/favicons/apple-touch-icon.png';
  const siteWebmanifestUrl = settings.siteWebmanifestUrl || '/favicons/site.webmanifest';

  const fileDefinitions = [
    {
      key: 'favicon96',
      filename: 'favicon-96x96.png',
      type: 'image/png',
      dimensions: '96x96',
      path: faviconUrl,
      tagSnippet: `<link rel="icon" type="image/png" href="${faviconUrl}" sizes="96x96" />`
    },
    {
      key: 'faviconSvg',
      filename: 'favicon.svg',
      type: 'image/svg+xml',
      dimensions: 'scalable vector',
      path: faviconSvgUrl,
      tagSnippet: `<link rel="icon" type="image/svg+xml" href="${faviconSvgUrl}" />`
    },
    {
      key: 'faviconIco',
      filename: 'favicon.ico',
      type: 'image/x-icon',
      dimensions: 'multi-size 16/32/48',
      path: faviconIcoUrl,
      tagSnippet: `<link rel="shortcut icon" href="${faviconIcoUrl}" />`
    },
    {
      key: 'appleTouchIcon',
      filename: 'apple-touch-icon.png',
      type: 'image/png',
      dimensions: '180x180',
      path: appleTouchIconUrl,
      tagSnippet: `<link rel="apple-touch-icon" sizes="180x180" href="${appleTouchIconUrl}" />`
    },
    {
      key: 'siteWebmanifest',
      filename: 'site.webmanifest',
      type: 'application/manifest+json',
      dimensions: 'JSON Manifest',
      path: siteWebmanifestUrl,
      tagSnippet: `<link rel="manifest" href="${siteWebmanifestUrl}" />`
    }
  ];

  const results: Record<string, any> = {};
  let allExist = true;
  let latestMod: Date | null = null;

  for (const def of fileDefinitions) {
    const filePath = path.join(FAVICONS_PUBLIC_DIR, def.filename);
    
    // Check if Cloudinary URL is stored in database settings
    const dbField = getSettingsFieldForFavicon(def.filename);
    const dbVal = (settings as any)[dbField];
    const isCloudUrl = dbVal && dbVal.startsWith('http');

    const exists = isCloudUrl ? true : fs.existsSync(filePath);
    if (!exists) {
      allExist = false;
    }

    let size = 0;
    let updatedAt: string | null = null;

    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        size = stat.size;
        updatedAt = stat.mtime.toISOString();
        if (!latestMod || stat.mtime > latestMod) {
          latestMod = stat.mtime;
        }
      } catch (err) {
        console.warn(`[FaviconManager] Error reading stat for ${def.filename}:`, err);
      }
    } else if (isCloudUrl) {
      // Dummy reasonable size fallback if locally missing but exists in cloud
      size = def.filename.endsWith('.webmanifest') ? 500 : 1000;
      updatedAt = new Date().toISOString();
    }

    const info: FaviconFileInfo = {
      key: def.key,
      filename: def.filename,
      path: def.path,
      exists,
      size,
      updatedAt,
      dimensions: def.dimensions,
      type: def.type,
      tagSnippet: def.tagSnippet
    };

    if (def.key === 'siteWebmanifest' && fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        results[def.key] = {
          ...info,
          manifestContent: JSON.parse(content)
        };
      } catch {
        results[def.key] = info;
      }
    } else {
      results[def.key] = info;
    }
  }

  const htmlSnippet = `<link rel="icon" type="image/png" href="${faviconUrl}" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="${faviconSvgUrl}" />
<link rel="shortcut icon" href="${faviconIcoUrl}" />
<link rel="apple-touch-icon" sizes="180x180" href="${appleTouchIconUrl}" />
<meta name="apple-mobile-web-app-title" content="${mobileTitle || 'AJW'}" />
<link rel="manifest" href="${siteWebmanifestUrl}" />`;

  return {
    favicon96: results.favicon96,
    faviconSvg: results.faviconSvg,
    faviconIco: results.faviconIco,
    appleTouchIcon: results.appleTouchIcon,
    siteWebmanifest: results.siteWebmanifest,
    mobileWebAppTitle: mobileTitle || 'AJW',
    htmlSnippet,
    allFilesExist: allExist,
    lastModifiedOverall: latestMod ? latestMod.toISOString() : null
  };
}

export async function saveSingleFaviconFile(targetFilename: string, buffer: Buffer | string): Promise<{ success: boolean; filename: string; path: string; size: number }> {
  ensureFaviconsDirectory();

  const allowedFiles = [
    'favicon-96x96.png',
    'favicon.svg',
    'favicon.ico',
    'apple-touch-icon.png',
    'site.webmanifest'
  ];

  if (!allowedFiles.includes(targetFilename)) {
    throw new Error(`Target file ${targetFilename} is not in allowed favicon files list`);
  }

  const filePath = path.join(FAVICONS_PUBLIC_DIR, targetFilename);
  let fileBuf: Buffer;

  // If buffer is string (e.g. SVG or JSON text or Base64 data URL)
  if (typeof buffer === 'string') {
    if (buffer.startsWith('data:')) {
      const base64Data = buffer.replace(/^data:[^;]+;base64,/, '');
      fileBuf = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, fileBuf);
      syncToDist(targetFilename, fileBuf);
    } else {
      fileBuf = Buffer.from(buffer, 'utf-8');
      fs.writeFileSync(filePath, buffer, 'utf-8');
      syncToDist(targetFilename, buffer);
    }
  } else {
    fileBuf = buffer;
    fs.writeFileSync(filePath, buffer);
    syncToDist(targetFilename, buffer);
  }

  const stat = fs.statSync(filePath);
  let returnPath = `/favicons/${targetFilename}`;

  // If TeleCloud or Cloudinary is configured, upload and save to DB
  const hasTeleCloud = await isTeleCloudConfiguredAsync();
  const hasCloudinary = !hasTeleCloud && await isCloudinaryConfiguredAsync();

  if (hasTeleCloud) {
    try {
      const tResult = await uploadToTeleCloud(fileBuf, targetFilename, {
        caption: `Favicon: ${targetFilename}`
      });
      if (tResult && tResult.url) {
        returnPath = tResult.url;
        const dbField = getSettingsFieldForFavicon(targetFilename);
        if (dbField) {
          await SettingsRepository.update({ [dbField]: tResult.url });
        }
      }
    } catch (err) {
      console.error(`[FaviconManager] TeleCloud upload failed for ${targetFilename}:`, err);
    }
  } else if (hasCloudinary) {
    try {
      const ext = path.extname(targetFilename).toLowerCase();
      const resourceType = (ext === '.webmanifest' || ext === '.json') ? 'raw' : 'image';
      const cldResult = await uploadToCloudinary(fileBuf, targetFilename, {
        folder: 'favicons',
        resourceType: resourceType
      });

      if (cldResult && cldResult.url) {
        returnPath = cldResult.url;
        const dbField = getSettingsFieldForFavicon(targetFilename);
        if (dbField) {
          await SettingsRepository.update({ [dbField]: cldResult.url });
        }
      }
    } catch (err) {
      console.error(`[FaviconManager] Cloudinary single upload failed for ${targetFilename}:`, err);
    }
  } else {
    // Save local path to database
    const dbField = getSettingsFieldForFavicon(targetFilename);
    if (dbField) {
      await SettingsRepository.update({ [dbField]: `/favicons/${targetFilename}` });
    }
  }

  return {
    success: true,
    filename: targetFilename,
    path: returnPath,
    size: stat.size
  };
}

export async function generateAllFaviconsFromMaster(
  imageBuffer: Buffer,
  options?: {
    appName?: string;
    shortName?: string;
    themeColor?: string;
    backgroundColor?: string;
  }
): Promise<{ success: boolean; generatedFiles: string[] }> {
  ensureFaviconsDirectory();

  const appName = options?.appName || 'Aapla Jalgaonwala';
  const shortName = options?.shortName || 'AJW';
  const themeColor = options?.themeColor || '#9B111E';
  const backgroundColor = options?.backgroundColor || '#FAF6ED';

  const generatedFiles: string[] = [];

  // 1. Generate 96x96 PNG
  const png96Buffer = await sharp(imageBuffer)
    .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(FAVICONS_PUBLIC_DIR, 'favicon-96x96.png'), png96Buffer);
  syncToDist('favicon-96x96.png', png96Buffer);
  generatedFiles.push('favicon-96x96.png');

  // 2. Generate 180x180 Apple Touch Icon (iOS prefers filled background)
  const apple180Buffer = await sharp(imageBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 250, g: 246, b: 237, alpha: 1 } })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(FAVICONS_PUBLIC_DIR, 'apple-touch-icon.png'), apple180Buffer);
  syncToDist('apple-touch-icon.png', apple180Buffer);
  generatedFiles.push('apple-touch-icon.png');

  // 3. Generate favicon.ico (as PNG format supported by modern browsers / standard ico)
  const icoBuffer = await sharp(imageBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(FAVICONS_PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  syncToDist('favicon.ico', icoBuffer);
  // Also keep root /public/favicon.ico updated
  try {
    fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), icoBuffer);
  } catch {}
  generatedFiles.push('favicon.ico');

  // 4. Generate/Update favicon.svg
  // Embed the high quality image inside scalable SVG
  const base64Png = png96Buffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Png}" x="0" y="0" width="100" height="100"/>
</svg>`;
  fs.writeFileSync(path.join(FAVICONS_PUBLIC_DIR, 'favicon.svg'), svgContent, 'utf-8');
  syncToDist('favicon.svg', svgContent);
  generatedFiles.push('favicon.svg');

  // Remote storage upload check (TeleCloud or Cloudinary)
  const hasTeleCloud = await isTeleCloudConfiguredAsync();
  const hasCloudinary = !hasTeleCloud && await isCloudinaryConfiguredAsync();
  const cldUrls: Record<string, string> = {};

  if (hasTeleCloud) {
    try {
      console.log('[FaviconManager] TeleCloud is configured, uploading generated assets...');
      const upload96 = await uploadToTeleCloud(png96Buffer, 'favicon-96x96.png', { caption: 'App Favicon 96x96' });
      cldUrls['favicon-96x96.png'] = upload96.url;

      const uploadApple = await uploadToTeleCloud(apple180Buffer, 'apple-touch-icon.png', { caption: 'Apple Touch Icon 180x180' });
      cldUrls['apple-touch-icon.png'] = uploadApple.url;

      const uploadIco = await uploadToTeleCloud(icoBuffer, 'favicon.ico', { caption: 'Favicon ICO' });
      cldUrls['favicon.ico'] = uploadIco.url;

      const svgBuffer = Buffer.from(svgContent, 'utf-8');
      const uploadSvg = await uploadToTeleCloud(svgBuffer, 'favicon.svg', { caption: 'Favicon SVG' });
      cldUrls['favicon.svg'] = uploadSvg.url;
    } catch (err) {
      console.error('[FaviconManager] TeleCloud uploads failed during multi-generation:', err);
    }
  } else if (hasCloudinary) {
    try {
      console.log('[FaviconManager] Cloudinary is configured, uploading generated assets...');
      const upload96 = await uploadToCloudinary(png96Buffer, 'favicon-96x96.png', { folder: 'favicons' });
      cldUrls['favicon-96x96.png'] = upload96.url;

      const uploadApple = await uploadToCloudinary(apple180Buffer, 'apple-touch-icon.png', { folder: 'favicons' });
      cldUrls['apple-touch-icon.png'] = uploadApple.url;

      const uploadIco = await uploadToCloudinary(icoBuffer, 'favicon.ico', { folder: 'favicons' });
      cldUrls['favicon.ico'] = uploadIco.url;

      const svgBuffer = Buffer.from(svgContent, 'utf-8');
      const uploadSvg = await uploadToCloudinary(svgBuffer, 'favicon.svg', { folder: 'favicons' });
      cldUrls['favicon.svg'] = uploadSvg.url;
    } catch (err) {
      console.error('[FaviconManager] Cloudinary uploads failed during multi-generation:', err);
    }
  }

  const png96Url = cldUrls['favicon-96x96.png'] || '/favicons/favicon-96x96.png';
  const appleTouchUrl = cldUrls['apple-touch-icon.png'] || '/favicons/apple-touch-icon.png';
  const svgUrl = cldUrls['favicon.svg'] || '/favicons/favicon.svg';

  // 5. Generate site.webmanifest
  const manifestData = {
    name: appName,
    short_name: shortName,
    description: "Authentic Khandeshi Banana Chips, Savouries & Kitchen Spices from Jalgaon",
    start_url: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      {
        src: png96Url,
        sizes: "96x96",
        type: "image/png"
      },
      {
        src: appleTouchUrl,
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: svgUrl,
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };

  const manifestJson = JSON.stringify(manifestData, null, 2);
  fs.writeFileSync(path.join(FAVICONS_PUBLIC_DIR, 'site.webmanifest'), manifestJson, 'utf-8');
  syncToDist('site.webmanifest', manifestJson);
  // Also keep public/site.webmanifest and public/manifest.json in sync
  try {
    fs.writeFileSync(path.join(process.cwd(), 'public', 'site.webmanifest'), manifestJson, 'utf-8');
    fs.writeFileSync(path.join(process.cwd(), 'public', 'manifest.json'), manifestJson, 'utf-8');
  } catch {}
  generatedFiles.push('site.webmanifest');

  if (hasTeleCloud) {
    try {
      const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
      const uploadManifest = await uploadToTeleCloud(manifestBuffer, 'site.webmanifest', {
        caption: 'App Web Manifest',
        mimeType: 'application/manifest+json'
      });
      cldUrls['site.webmanifest'] = uploadManifest.url;
    } catch (err) {
      console.error('[FaviconManager] TeleCloud manifest upload failed during generation:', err);
    }
  } else if (hasCloudinary) {
    try {
      const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
      const uploadManifest = await uploadToCloudinary(manifestBuffer, 'site.webmanifest', {
        folder: 'favicons',
        resourceType: 'raw'
      });
      cldUrls['site.webmanifest'] = uploadManifest.url;
    } catch (err) {
      console.error('[FaviconManager] Cloudinary manifest upload failed during generation:', err);
    }
  }

  // Update MySQL Settings via SettingsRepository
  const dbUpdates = {
    faviconUrl: cldUrls['favicon-96x96.png'] || '/favicons/favicon-96x96.png',
    faviconSvgUrl: cldUrls['favicon.svg'] || '/favicons/favicon.svg',
    faviconIcoUrl: cldUrls['favicon.ico'] || '/favicons/favicon.ico',
    appleTouchIconUrl: cldUrls['apple-touch-icon.png'] || '/favicons/apple-touch-icon.png',
    siteWebmanifestUrl: cldUrls['site.webmanifest'] || '/favicons/site.webmanifest'
  };
  await SettingsRepository.update(dbUpdates);

  return {
    success: true,
    generatedFiles
  };
}

export async function updateWebManifestJson(manifestContent: any): Promise<{ success: boolean; content: any }> {
  ensureFaviconsDirectory();
  const manifestJson = typeof manifestContent === 'string' ? manifestContent : JSON.stringify(manifestContent, null, 2);
  fs.writeFileSync(path.join(FAVICONS_PUBLIC_DIR, 'site.webmanifest'), manifestJson, 'utf-8');
  syncToDist('site.webmanifest', manifestJson);

  try {
    fs.writeFileSync(path.join(process.cwd(), 'public', 'site.webmanifest'), manifestJson, 'utf-8');
    fs.writeFileSync(path.join(process.cwd(), 'public', 'manifest.json'), manifestJson, 'utf-8');
  } catch {}

  const hasTeleCloud = await isTeleCloudConfiguredAsync();
  const hasCloudinary = !hasTeleCloud && await isCloudinaryConfiguredAsync();

  if (hasTeleCloud) {
    try {
      const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
      const uploadManifest = await uploadToTeleCloud(manifestBuffer, 'site.webmanifest', {
        caption: 'App Web Manifest',
        mimeType: 'application/manifest+json'
      });
      if (uploadManifest && uploadManifest.url) {
        await SettingsRepository.update({ siteWebmanifestUrl: uploadManifest.url });
      }
    } catch (err) {
      console.error('[FaviconManager] TeleCloud custom manifest upload failed:', err);
    }
  } else if (hasCloudinary) {
    try {
      const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
      const uploadManifest = await uploadToCloudinary(manifestBuffer, 'site.webmanifest', {
        folder: 'favicons',
        resourceType: 'raw'
      });
      if (uploadManifest && uploadManifest.url) {
        await SettingsRepository.update({ siteWebmanifestUrl: uploadManifest.url });
      }
    } catch (err) {
      console.error('[FaviconManager] Cloudinary custom manifest upload failed:', err);
    }
  } else {
    await SettingsRepository.update({ siteWebmanifestUrl: '/favicons/site.webmanifest' });
  }

  return {
    success: true,
    content: typeof manifestContent === 'string' ? JSON.parse(manifestContent) : manifestContent
  };
}

export interface IconSyncResultItem {
  filename: string;
  key: string;
  size: number;
  success: boolean;
  s3Url?: string;
  error?: string;
}

export async function syncAllIconsToS3(): Promise<{
  success: boolean;
  message: string;
  items: IconSyncResultItem[];
  settingsUpdated: Record<string, string>;
}> {
  ensureFaviconsDirectory();

  const iconFiles = [
    { filename: 'favicon-96x96.png', key: 'favicon96', dbField: 'faviconUrl', mimeType: 'image/png' },
    { filename: 'favicon.svg', key: 'faviconSvg', dbField: 'faviconSvgUrl', mimeType: 'image/svg+xml' },
    { filename: 'favicon.ico', key: 'faviconIco', dbField: 'faviconIcoUrl', mimeType: 'image/x-icon' },
    { filename: 'apple-touch-icon.png', key: 'appleTouchIcon', dbField: 'appleTouchIconUrl', mimeType: 'image/png' },
    { filename: 'site.webmanifest', key: 'siteWebmanifest', dbField: 'siteWebmanifestUrl', mimeType: 'application/manifest+json' }
  ];

  const results: IconSyncResultItem[] = [];
  const settingsToUpdate: Record<string, string> = {};

  for (const item of iconFiles) {
    const localPath = path.join(FAVICONS_PUBLIC_DIR, item.filename);
    
    if (!fs.existsSync(localPath)) {
      results.push({
        filename: item.filename,
        key: item.key,
        size: 0,
        success: false,
        error: `Local icon file ${item.filename} not found on server`
      });
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(localPath);
      const stat = fs.statSync(localPath);

      const uploadRes = await uploadToTeleCloud(fileBuffer, item.filename, {
        caption: `Favicon Asset: ${item.filename}`,
        mimeType: item.mimeType
      });

      if (uploadRes && uploadRes.url) {
        settingsToUpdate[item.dbField] = uploadRes.url;
        results.push({
          filename: item.filename,
          key: item.key,
          size: stat.size,
          success: true,
          s3Url: uploadRes.url
        });
      } else {
        results.push({
          filename: item.filename,
          key: item.key,
          size: stat.size,
          success: false,
          error: 'S3 returned an empty URL response'
        });
      }
    } catch (err: any) {
      console.error(`[FaviconManager] Failed to sync ${item.filename} to S3:`, err);
      results.push({
        filename: item.filename,
        key: item.key,
        size: 0,
        success: false,
        error: err?.message || 'Failed to upload to S3'
      });
    }
  }

  if (Object.keys(settingsToUpdate).length > 0) {
    try {
      await SettingsRepository.update(settingsToUpdate);
    } catch (err) {
      console.error('[FaviconManager] Failed to update settings with S3 URLs:', err);
    }
  }

  const allSuccess = results.length > 0 && results.every(r => r.success);

  return {
    success: allSuccess || results.some(r => r.success),
    message: allSuccess
      ? 'All admin panel & site icons successfully uploaded and synced to S3'
      : 'Synced available icons to S3 with some notices',
    items: results,
    settingsUpdated: settingsToUpdate
  };
}

