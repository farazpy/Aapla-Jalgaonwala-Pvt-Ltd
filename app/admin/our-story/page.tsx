'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MediaTab } from '@/components/admin/MediaTab';
import { Check, ExternalLink, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function AdminOurStoryMediaPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <AdminLayout
      pageTitle="Our Story Media & Gallery"
      breadcrumbs={[
        { label: 'Online Store', href: '/admin/our-story' },
        { label: 'Our Story Media & Gallery' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/our-story"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>View Live Our Story Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
        </div>
      }
    >
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      <MediaTab showToast={showToast} defaultSubTab="gallery" />
    </AdminLayout>
  );
}
