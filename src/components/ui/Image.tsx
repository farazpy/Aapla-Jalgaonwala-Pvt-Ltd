import React from 'react';
import { optimizeImageUrl } from '@/lib/utils';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  width?: number | string;
  height?: number | string;
}

export function Image({
  src,
  alt,
  fill,
  priority,
  sizes,
  className = '',
  referrerPolicy = 'no-referrer',
  width,
  height,
  ...rest
}: ImageProps) {
  const fillClass = fill ? 'absolute inset-0 w-full h-full object-cover' : '';
  const numWidth = typeof width === 'number' ? width : (width ? parseInt(width, 10) : undefined);
  const targetWidth = numWidth || (priority ? 1000 : 800);
  const optimizedSrc = src ? optimizeImageUrl(src, targetWidth) : '/favicon.ico';

  return (
    <img
      src={optimizedSrc}
      alt={alt || 'Image'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      width={width}
      height={height}
      className={`${fillClass} ${className}`.trim()}
      referrerPolicy={referrerPolicy}
      onError={(e) => {
        // Fallback for broken images
        const target = e.currentTarget;
        if (!target.dataset.failed) {
          target.dataset.failed = 'true';
          target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
        }
      }}
      {...rest}
    />
  );
}

export default Image;
