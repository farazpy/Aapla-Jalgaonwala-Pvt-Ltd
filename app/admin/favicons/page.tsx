'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FaviconSuiteManager } from '@/components/admin/FaviconSuiteManager';
import { Check } from 'lucide-react';

export default function AdminFaviconsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: any) => {
    const safeMsg = typeof msg === 'string'
      ? msg
      : (msg?.message || msg?.error?.message || (typeof msg === 'object' ? JSON.stringify(msg) : String(msg)));
    setToastMessage(safeMsg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <AdminLayout
      pageTitle="Favicon & Web App Icons"
      breadcrumbs={[
        { label: 'Online Store', href: '/admin/branding' },
        { label: 'Favicons & Web App Icons' }
      ]}
    >
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <FaviconSuiteManager showToast={showToast} />
      </div>
    </AdminLayout>
  );
}
