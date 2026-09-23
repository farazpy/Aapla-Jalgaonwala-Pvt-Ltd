'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from '@/components/navigation/AnnouncementBar';
import { Navbar } from '@/components/navigation/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/navigation/Footer';
import { FloatingAssistant } from '@/components/assistant/FloatingAssistant';
import { MarathiLanguageModal } from '@/components/navigation/MarathiLanguageModal';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isIframe = pathname?.startsWith('/iframe') || pathname?.startsWith('/tracking');

  React.useEffect(() => {
    // Ensure and synchronize all standard favicon & manifest tags across ecommerce pages
    const syncFavicons = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        const mobileTitle = json.data?.mobileWebAppTitle || 'AJW';

        // Ensure Apple mobile web app title meta tag
        let metaTitle = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
        if (!metaTitle) {
          metaTitle = document.createElement('meta');
          metaTitle.name = 'apple-mobile-web-app-title';
          document.head.appendChild(metaTitle);
        }
        metaTitle.content = mobileTitle;

        // Ensure standard manifest link
        let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
        if (!manifestLink) {
          manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          document.head.appendChild(manifestLink);
        }
        manifestLink.href = json.data?.siteWebmanifestUrl || '/favicons/site.webmanifest';

        // Ensure 96x96 PNG icon
        let icon96 = document.querySelector<HTMLLinkElement>("link[rel='icon'][sizes='96x96']");
        if (!icon96) {
          icon96 = document.createElement('link');
          icon96.rel = 'icon';
          icon96.type = 'image/png';
          icon96.sizes = '96x96';
          document.head.appendChild(icon96);
        }
        icon96.href = json.data?.faviconUrl || '/favicons/favicon-96x96.png';

        // Ensure SVG icon
        let iconSvg = document.querySelector<HTMLLinkElement>("link[rel='icon'][type='image/svg+xml']");
        if (!iconSvg) {
          iconSvg = document.createElement('link');
          iconSvg.rel = 'icon';
          iconSvg.type = 'image/svg+xml';
          document.head.appendChild(iconSvg);
        }
        iconSvg.href = json.data?.faviconSvgUrl || '/favicons/favicon.svg';

        // Ensure Shortcut icon
        let shortcutIcon = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
        if (!shortcutIcon) {
          shortcutIcon = document.createElement('link');
          shortcutIcon.rel = 'shortcut icon';
          document.head.appendChild(shortcutIcon);
        }
        shortcutIcon.href = json.data?.faviconIcoUrl || '/favicons/favicon.ico';

        // Ensure Apple Touch icon 180x180
        let appleTouch = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
        if (!appleTouch) {
          appleTouch = document.createElement('link');
          appleTouch.rel = 'apple-touch-icon';
          appleTouch.sizes = '180x180';
          document.head.appendChild(appleTouch);
        }
        appleTouch.href = json.data?.appleTouchIconUrl || '/favicons/apple-touch-icon.png';
      } catch (err) {
        console.warn('Notice syncing favicon tags:', err);
      }
    };
    syncFavicons();
  }, []);

  if (isAdmin || isIframe) {
    return <main className="flex-1 min-h-screen bg-[#FAF6ED]">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <FloatingAssistant />
      <MarathiLanguageModal />
      <Footer />
    </>
  );
}
