import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import path from 'path';
import { getSharp } from './safeSharp';
import { CloudinaryAssetRepository } from '../repositories/CloudinaryAssetRepository';
import { MediaRepository } from '../repositories/MediaRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  name: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
  resourceType: string;
  createdAt: string;
}

export async function getCloudinaryClient() {
  let cloudName = '';
  let apiKey = '';
  let apiSecret = '';

  try {
    const settings = await SettingsRepository.get();
    if ((settings as any).cloudinaryCloudName) cloudName = (settings as any).cloudinaryCloudName;
    if ((settings as any).cloudinaryApiKey) apiKey = (settings as any).cloudinaryApiKey;
    if ((settings as any).cloudinaryApiSecret) apiSecret = (settings as any).cloudinaryApiSecret;
  } catch (err) {
    console.warn('[Cloudinary] Error fetching credentials from Admin Settings:', err);
  }

  // Fallback to environment variables if not configured in Admin Settings
  if (!cloudName) {
    cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  }
  if (!apiKey) {
    apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '';
  }
  if (!apiSecret) {
    apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || '';
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export async function isCloudinaryConfiguredAsync(): Promise<boolean> {
  const client = await getCloudinaryClient();
  return Boolean(client);
}

/**
 * Adds the `fl_original` flag to a Cloudinary delivery URL.
 * Bypasses Cloudinary's default optimization and delivers the exact original asset
 * without consuming transformation credits.
 * Example:
 *   Input:  https://res.cloudinary.com/xbtfj9zf/image/upload/v1788262602/sample.png
 *   Output: https://res.cloudinary.com/xbtfj9zf/image/upload/fl_original/v1788262602/sample.png
 */
export function addCloudinaryOriginalFlag(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/raw/upload/') || url.includes('/video/upload/')) return url;

  // Clean up any legacy pl_original typos
  let cleaned = url.replace(/\/pl_original\//g, '/fl_original/');

  // If already contains fl_original correctly placed after upload/
  if (cleaned.includes('/upload/fl_original/')) {
    return cleaned;
  }

  // Find where /upload/ or /image/upload/ is located
  const match = cleaned.match(/(\/(?:image\/)?upload\/)(.*)/);
  if (!match) return cleaned;

  const prefix = cleaned.substring(0, match.index! + match[1].length);
  let remainder = match[2];

  // Remove any leading fl_original/ or pl_original/ if present
  remainder = remainder.replace(/^(fl_original\/|pl_original\/)+/, '');

  // Check if remainder starts with transformation segments (e.g., f_auto,q_auto, w_500, c_fill, etc.)
  const segments = remainder.split('/');
  let targetSegments = segments;

  if (segments.length > 0) {
    const first = segments[0];
    const isTransform = first.includes(',') || /^(f_|q_|w_|c_|h_|dpr_|b_|e_|o_|fl_|ar_|g_|pl_)/.test(first);
    if (isTransform) {
      targetSegments = segments.slice(1);
    }
  }

  return `${prefix}fl_original/${targetSegments.join('/')}`;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Uploads a Buffer strictly to Cloudinary using upload_stream
 * Pre-optimizes large image buffers in memory via Sharp before network transmission
 * to drastically reduce upload times (e.g. 15MB -> 250KB in ~15ms).
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  options?: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<CloudinaryUploadResult> {
  const client = await getCloudinaryClient();
  if (!client) {
    throw new Error(
      'Cloudinary credentials are not configured. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in environment variables or Admin Settings.'
    );
  }

  const folder = options?.folder || 'aapla_jalgaonwala';
  const ext = path.extname(originalName).toLowerCase().replace('.', '');
  const isVideo = ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext);
  const isPdf = ext === 'pdf';
  const resourceType = options?.resourceType || (isPdf ? 'raw' : (isVideo ? 'video' : 'image'));
  const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'asset';
  const publicId = `${folder}/${Date.now()}_${baseName}`;

  // Speed Optimization: Pre-compress image buffer in memory if > 150KB
  if (resourceType === 'image' && !['svg', 'pdf', 'ico', 'webmanifest'].includes(ext) && buffer.length > 150 * 1024) {
    try {
      const sharp = await getSharp();
      if (sharp) {
        let sharpPipeline = sharp(buffer).resize({
          width: 2400,
          height: 2400,
          fit: 'inside',
          withoutEnlargement: true
        });

        if (ext === 'png') {
          sharpPipeline = sharpPipeline.png({ compressionLevel: 6, quality: 88, palette: true });
        } else if (ext === 'webp') {
          sharpPipeline = sharpPipeline.webp({ quality: 85, effort: 3 });
        } else {
          sharpPipeline = sharpPipeline.jpeg({ quality: 85, mozjpeg: true });
        }

        const compressedBuffer = await sharpPipeline.toBuffer();
        if (compressedBuffer && compressedBuffer.length < buffer.length) {
          buffer = compressedBuffer;
        }
      }
    } catch (sharpErr) {
      console.warn('[Cloudinary Fast Pre-Compression Warning]', sharpErr);
    }
  }

  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}_${baseName}`,
        overwrite: true,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error('[Cloudinary Upload Error]', error);
          return reject(error || new Error('Failed to upload to Cloudinary'));
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

  const rawUrl = uploadResult.secure_url || uploadResult.url;
  const isImage = resourceType === 'image' || (!isVideo && !isPdf);
  const secureUrl = isImage ? addCloudinaryOriginalFlag(rawUrl) : rawUrl;
  const result: CloudinaryUploadResult = {
    url: secureUrl,
    publicId: uploadResult.public_id || publicId,
    name: originalName || baseName,
    bytes: uploadResult.bytes || buffer.length,
    format: uploadResult.format || ext || 'webp',
    width: uploadResult.width || 0,
    height: uploadResult.height || 0,
    resourceType: uploadResult.resource_type || resourceType,
    createdAt: uploadResult.created_at ? new Date(uploadResult.created_at).toISOString() : new Date().toISOString()
  };

  // Register in Cloudinary Asset Library
  try {
    await CloudinaryAssetRepository.addAsset({
      url: result.url,
      publicId: result.publicId,
      name: result.name,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (err) {
    console.warn('[CloudinaryAssetRepository Warning]', err);
  }

  // Register in MediaRepository
  try {
    await MediaRepository.create({
      url: result.url,
      imgUrl: result.url,
      imageUrl: result.url,
      title: result.name,
      alt: result.name,
      folder: folder,
      size: result.bytes,
      width: result.width,
      height: result.height,
      mimeType: ext === 'pdf' ? 'application/pdf' : (resourceType === 'video' ? `video/${result.format}` : `image/${result.format}`)
    });
  } catch (err) {
    console.warn('[MediaRepository Warning]', err);
  }

  return result;
}
