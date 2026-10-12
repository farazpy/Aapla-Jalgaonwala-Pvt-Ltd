import React, { useState, useEffect, useRef } from 'react';

interface LazyRenderProps {
  children: React.ReactNode;
  rootMargin?: string;
  minHeight?: string | number;
  className?: string;
}

/**
 * Defers rendering and network asset requests for below-the-fold content
 * until the visitor scrolls within proximity (default 350px).
 * Prevents flooding the VPS with 25+ simultaneous image downloads on page load.
 */
export const LazyRender: React.FC<LazyRenderProps> = ({
  children,
  rootMargin = '350px',
  minHeight = '300px',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin
      }
    );

    const el = containerRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVisible, rootMargin]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={!isVisible ? { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight } : undefined}
    >
      {isVisible ? children : null}
    </div>
  );
};

export default LazyRender;
