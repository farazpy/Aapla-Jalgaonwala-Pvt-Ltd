import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LayoutShell } from '@/components/navigation/LayoutShell';
import { TopProgressLoader } from '@/components/navigation/TopProgressLoader';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Aapla Jalgaonwala | Authentic Jalgaon Taste in Every Bite',
  description: 'Authentic Jalgaon banana chips in 10 unique flavours, farsaan, kitchen masalas, and regional dry chutneys. Directly sourced from Jalgaon farmers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-[#FAF6ED] text-[#1c1917] antialiased">
        <TopProgressLoader />
        <CartProvider>
          <WishlistProvider>
            <LayoutShell>{children}</LayoutShell>
          </WishlistProvider>
        </CartProvider>
        <Script src="/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

