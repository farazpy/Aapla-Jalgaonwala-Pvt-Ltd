'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CategoriesTab } from '@/components/admin/CategoriesTab';

export default function AdminCategoriesPage() {
  return (
    <AdminLayout
      pageTitle="Categories"
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: 'Categories' }
      ]}
    >
      <CategoriesTab />
    </AdminLayout>
  );
}
