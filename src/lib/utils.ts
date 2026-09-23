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

  const uploadToken = '/image/upload/';
  const uploadIndex = url.indexOf(uploadToken);
  if (uploadIndex === -1) {
    const altToken = '/upload/';
    const altIndex = url.indexOf(altToken);
    if (altIndex === -1) return url;
    if (url.includes('/raw/upload/') || url.includes('/video/upload/')) return url;

    const prefix = url.substring(0, altIndex + altToken.length);
    const suffix = url.substring(altIndex + altToken.length);
    if (suffix.startsWith('fl_original/') || suffix === 'fl_original') return url;

    const parts = suffix.split('/');
    const firstSegment = parts[0];
    const isTransform = firstSegment.includes(',') || /^(f_|q_|w_|c_|h_|dpr_|b_|e_|o_|fl_)/.test(firstSegment);
    if (isTransform) {
      return `${prefix}fl_original/${parts.slice(1).join('/')}`;
    }
    return `${prefix}fl_original/${suffix}`;
  }

  const prefix = url.substring(0, uploadIndex + uploadToken.length);
  const suffix = url.substring(uploadIndex + uploadToken.length);

  if (suffix.startsWith('fl_original/') || suffix === 'fl_original') {
    return url;
  }

  const parts = suffix.split('/');
  const firstSegment = parts[0];
  const isTransform = firstSegment.includes(',') || /^(f_|q_|w_|c_|h_|dpr_|b_|e_|o_|fl_)/.test(firstSegment);
  if (isTransform) {
    return `${prefix}fl_original/${parts.slice(1).join('/')}`;
  }

  return `${prefix}fl_original/${suffix}`;
}

/**
 * Delivers optimized/original image URLs.
 * For Cloudinary assets, strictly applies `fl_original` to disable automatic format/quality transformations
 * and preserve transformation credits as requested.
 */
export function optimizeImageUrl(url: string, width: number = 600, quality: string | number = 'auto'): string {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary: Disable optimization and deliver original asset using fl_original to save credits
  if (url.includes('res.cloudinary.com')) {
    return applyCloudinaryOriginalFlag(url);
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
