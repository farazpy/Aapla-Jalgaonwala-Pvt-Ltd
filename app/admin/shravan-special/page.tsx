'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShravanSpecialRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/shravan');
  }, [router]);

  return null;
}
