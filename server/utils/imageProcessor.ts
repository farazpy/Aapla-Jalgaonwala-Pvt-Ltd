import multer from 'multer';
import { getSharp } from './safeSharp';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';

// In-memory multer storage for processing with Sharp
const memoryStorage = multer.memoryStorage();

export const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max
  }
});

// Middleware wrapper that safely handles any field without throwing 500 errors
export const safeUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.any()(req, res, (err: any) => {
    if (err) {
      console.warn('[Multer Warning]', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds maximum limit of 25MB'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error'
      });
    }
    next();
  });
};

export const uploadMiddleware = upload;

export interface ProcessedImageResult {
  filename: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Optimizes an image buffer using Sharp, converts to webp (or jpeg), and saves to public uploads
 */
export async function processAndSaveImage(
  buffer: Buffer,
  originalName: string,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number; format?: 'webp' | 'jpeg' | 'png' }
): Promise<ProcessedImageResult> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(originalName).toLowerCase().replace('.', '');
  const isSvg = ext === 'svg' || originalName.toLowerCase().endsWith('.svg');
  const isGif = ext === 'gif' || originalName.toLowerCase().endsWith('.gif');
  const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'image';

  // For SVGs and animated GIFs, write directly to preserve vectors / animations
  if (isSvg || isGif) {
    const targetFormat = isSvg ? 'svg' : 'gif';
    const uniqueName = `${Date.now()}-${baseName}.${targetFormat}`;
    const targetPath = path.join(uploadDir, uniqueName);
    await fs.writeFile(targetPath, buffer);
    return {
      filename: uniqueName,
      url: `/uploads/${uniqueName}`,
      width: 0,
      height: 0,
      format: targetFormat,
      size: buffer.length
    };
  }

  const targetFormat = options?.format || 'webp';
  const quality = options?.quality || 85;
  const maxWidth = options?.maxWidth || 1600;
  const maxHeight = options?.maxHeight || 1600;
  const uniqueName = `${Date.now()}-${baseName}.${targetFormat}`;
  const targetPath = path.join(uploadDir, uniqueName);

  const sharp = await getSharp();
  if (!sharp) {
    const rawExt = ext || 'png';
    const rawName = `${Date.now()}-${baseName}.${rawExt}`;
    const rawPath = path.join(uploadDir, rawName);
    await fs.writeFile(rawPath, buffer);
    return {
      filename: rawName,
      url: `/uploads/${rawName}`,
      width: 0,
      height: 0,
      format: rawExt,
      size: buffer.length
    };
  }

  try {
    let sharpInstance = sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      });

    if (targetFormat === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (targetFormat === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else {
      sharpInstance = sharpInstance.png({ compressionLevel: 8 });
    }

    const outputBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    await fs.writeFile(targetPath, outputBuffer);

    return {
      filename: uniqueName,
      url: `/uploads/${uniqueName}`,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: targetFormat,
      size: outputBuffer.length
    };
  } catch (sharpError) {
    console.warn('[Sharp] Processing fallback to raw write:', sharpError);
    const fallbackExt = ext || 'png';
    const fallbackName = `${Date.now()}-${baseName}.${fallbackExt}`;
    const fallbackPath = path.join(uploadDir, fallbackName);
    await fs.writeFile(fallbackPath, buffer);

    return {
      filename: fallbackName,
      url: `/uploads/${fallbackName}`,
      width: 0,
      height: 0,
      format: fallbackExt,
      size: buffer.length
    };
  }
}

