'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TopProgressLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, startTransition] = useTransition();

  // Reset/Complete progress when pathname or searchParams change
  useEffect(() => {
    if (isNavigating) {
      const timer1 = setTimeout(() => {
        setProgress(100);
      }, 0);
      const timer2 = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [pathname, searchParams, isNavigating]);

  // Safety fallback: Ensure loader auto-dismisses after 2.5s maximum even if pathname does not change
  useEffect(() => {
    if (isNavigating) {
      const safetyTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsNavigating(false);
          setProgress(0);
        }, 150);
      }, 2000);
      return () => clearTimeout(safetyTimer);
    }
  }, [isNavigating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isNavigating) {
      const startTimer = setTimeout(() => {
        setProgress(15);
      }, 0);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 150);

      return () => {
        clearTimeout(startTimer);
        clearInterval(interval);
      };
    }
  }, [isNavigating]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const anchor = target.closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');

        // Ignore external links, downloads, new tabs, or anchor/hash links
        if (
          !href ||
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          targetAttr === '_blank' ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }

        // Resolve target URL
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(href, window.location.href);

        // Ignore same URL
        if (currentUrl.href === targetUrl.href) {
          return;
        }

        // Only trigger for same origin
        if (currentUrl.origin === targetUrl.origin) {
          setIsNavigating(true);
        }
      } catch {
        // Safe catch - no-op
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-stone-200/40">
      <div
        className="h-full bg-gradient-to-r from-[#9B111E] via-[#D9531E] to-amber-500 transition-all duration-200 ease-out shadow-[0_0_10px_#9B111E]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export const TopProgressLoader: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <TopProgressLoaderContent />
    </Suspense>
  );
};

