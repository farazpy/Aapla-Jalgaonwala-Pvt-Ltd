import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export function Image({
  src,
  alt,
  fill,
  priority,
  sizes,
  className = '',
  referrerPolicy = 'no-referrer',
  ...rest
}: ImageProps) {
  const fillClass = fill ? 'absolute inset-0 w-full h-full object-cover' : '';
  return (
    <img
      src={src || '/favicon.ico'}
      alt={alt || 'Image'}
      loading={priority ? 'eager' : 'lazy'}
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
