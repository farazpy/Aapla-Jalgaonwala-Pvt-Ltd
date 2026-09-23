'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MediaTab } from '@/components/admin/MediaTab';
import { Check } from 'lucide-react';

export default function AdminMediaPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <AdminLayout
      pageTitle="Gallery & Videos"
      breadcrumbs={[
        { label: 'Online Store', href: '/admin/media' },
        { label: 'Gallery & Videos' }
      ]}
    >
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      <MediaTab showToast={showToast} />
    </AdminLayout>
  );
}
