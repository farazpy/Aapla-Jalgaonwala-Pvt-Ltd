'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from '@/components/navigation/AnnouncementBar';
import { Navbar } from '@/components/navigation/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/navigation/Footer';
import { FloatingAssistant } from '@/components/assistant/FloatingAssistant';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  React.useEffect(() => {
    // Load and inject dynamic favicon
    const loadFavicon = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data?.faviconUrl) {
          // 1. Desktop standard favicon link
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = json.data.faviconUrl;

          // 2. Apple Touch Icon for iOS devices
          let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
          if (!appleLink) {
            appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.sizes.add('180x180');
            document.head.appendChild(appleLink);
          }
          appleLink.href = '/apple-touch-icon.png';

          // 3. Web manifest for Android and dynamic installations
          let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
          if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            document.head.appendChild(manifestLink);
          }
          manifestLink.href = '/site.webmanifest';
        }
      } catch (err) {
        console.warn('Error loading dynamic favicon:', err);
      }
    };
    loadFavicon();
  }, []);

  if (isAdmin) {
    return <main className="flex-1 min-h-screen bg-stone-50">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <FloatingAssistant />
      <Footer />
    </>
  );
}
