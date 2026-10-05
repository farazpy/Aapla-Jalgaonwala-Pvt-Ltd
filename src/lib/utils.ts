import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Adds the `fl_original` flag to a Cloudinary delivery URL.
 * This tells Cloudinary to bypass default optimization and send the exact original asset
 * without automatic format/quality optimization or consuming transformation credits.
 * Example:
 *   /image/upload/sample.jpg -> /image/upload/fl_original/sample.jpg
 *   /image/upload/v12345/sample.jpg -> /image/upload/fl_original/v12345/sample.jpg
 */
export function applyCloudinaryOriginalFlag(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/raw/upload/') || url.includes('/video/upload/')) return url;

  let cleaned = url.replace(/\/pl_original\//g, '/fl_original/');
  if (cleaned.includes('/upload/fl_original/')) {
    return cleaned;
  }

  const uploadToken = '/image/upload/';
  const uploadIndex = cleaned.indexOf(uploadToken);
  if (uploadIndex === -1) {
    const altToken = '/upload/';
    const altIndex = cleaned.indexOf(altToken);
    if (altIndex === -1) return cleaned;

    const prefix = cleaned.substring(0, altIndex + altToken.length);
    const suffix = cleaned.substring(altIndex + altToken.length);
    if (suffix.startsWith('fl_original/') || suffix === 'fl_original') return cleaned;

    const parts = suffix.split('/');
    const firstSegment = parts[0];
    const isTransform = firstSegment.includes(',') || /^(f_|q_|w_|c_|h_|dpr_|b_|e_|o_|fl_|pl_)/.test(firstSegment);
    if (isTransform) {
      return `${prefix}fl_original/${parts.slice(1).join('/')}`;
    }
    return `${prefix}fl_original/${suffix}`;
  }

  const prefix = cleaned.substring(0, uploadIndex + uploadToken.length);
  const suffix = cleaned.substring(uploadIndex + uploadToken.length);

  if (suffix.startsWith('fl_original/') || suffix === 'fl_original') {
    return cleaned;
  }

  const parts = suffix.split('/');
  const firstSegment = parts[0];
  const isTransform = firstSegment.includes(',') || /^(f_|q_|w_|c_|h_|dpr_|b_|e_|o_|fl_|pl_)/.test(firstSegment);
  if (isTransform) {
    return `${prefix}fl_original/${parts.slice(1).join('/')}`;
  }

  return `${prefix}fl_original/${suffix}`;
}

/**
 * Dynamically transforms Cloudinary URLs for fast, high-performance web delivery (LCP optimization).
 * Automatically delivers modern AVIF/WebP formats, applies auto-quality, and caps dimensions.
 */
export function getCloudinaryOptimizedUrl(url: string, width: number = 800, _quality: string | number = 'auto'): string {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/raw/upload/') || url.includes('/video/upload/')) return url;

  // Clean out any existing fl_original, pl_original, or previous transformation params
  let cleaned = url.replace(/\/fl_original\//g, '/').replace(/\/pl_original\//g, '/');

  const uploadToken = '/image/upload/';
  let uploadIndex = cleaned.indexOf(uploadToken);
  let tokenLength = uploadToken.length;

  if (uploadIndex === -1) {
    const altToken = '/upload/';
    uploadIndex = cleaned.indexOf(altToken);
    tokenLength = altToken.length;
    if (uploadIndex === -1) return cleaned;
  }

  const prefix = cleaned.substring(0, uploadIndex + tokenLength);
  let suffix = cleaned.substring(uploadIndex + tokenLength);

  // Strip existing transformation segment if present
  const parts = suffix.split('/');
  if (parts.length > 1) {
    const firstSeg = parts[0];
    const isTransform = firstSeg.includes(',') || /^(f_|q_|w_|c_|h_|dpr_|b_|e_|o_|fl_|pl_)/.test(firstSeg);
    if (isTransform) {
      suffix = parts.slice(1).join('/');
    }
  }

  const transformParams = `f_auto,q_auto,w_${width},c_limit`;
  return `${prefix}${transformParams}/${suffix}`;
}

/**
 * Delivers optimized image URLs for Web & LCP rendering.
 */
export function optimizeImageUrl(url: string, width: number = 600, quality: string | number = 'auto'): string {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary: Fast dynamic WebP/AVIF compression and scaling for web display & LCP
  if (url.includes('res.cloudinary.com')) {
    return getCloudinaryOptimizedUrl(url, width, quality);
  }

  // Unsplash Optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', width.toString());
      u.searchParams.set('q', quality === 'auto' ? '75' : quality.toString());
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Returns responsive image props (src, srcSet, sizes) to match displayed card dimensions.
 */
export function getResponsiveImageProps(url: string, width: number = 240, sizes?: string) {
  if (!url || typeof url !== 'string') {
    return { src: url };
  }
  const defaultSrc = optimizeImageUrl(url, width);
  const retinaSrc = optimizeImageUrl(url, Math.min(Math.round(width * 1.5), 600));
  return {
    src: defaultSrc,
    srcSet: `${defaultSrc} 1x, ${retinaSrc} 1.5x`,
    sizes: sizes || `${width}px`
  };
}

/**
 * Format DTDC raw date strings (e.g. '10092026' -> '10 Sep 2026')
 */
export function formatDtdcDate(rawDate?: string): string {
  if (!rawDate || typeof rawDate !== 'string') return '';
  const clean = rawDate.trim();
  if (clean.includes(' ') || clean.includes('-') || clean.includes('/')) return clean;
  if (clean.length === 8 && /^\d{8}$/.test(clean)) {
    const day = clean.substring(0, 2);
    const monthIndex = parseInt(clean.substring(2, 4), 10) - 1;
    const year = clean.substring(4, 8);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIndex] || clean.substring(2, 4);
    return `${day} ${monthName} ${year}`;
  }
  return clean;
}

/**
 * Format DTDC raw time strings (e.g. '1901' -> '19:01' or '20:39:47' -> '20:39')
 */
export function formatDtdcTime(rawTime?: string): string {
  if (!rawTime || typeof rawTime !== 'string') return '';
  const clean = rawTime.trim();
  if (clean.length === 4 && /^\d{4}$/.test(clean)) {
    return `${clean.substring(0, 2)}:${clean.substring(2, 4)}`;
  }
  if (clean.includes(':')) {
    const parts = clean.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  return clean;
}
