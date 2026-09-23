'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home, MessageSquare } from 'lucide-react';
import { ClientLogger } from '@/lib/clientLogger';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    ClientLogger.error(error, {
      module: 'AppError',
      metadata: { digest: error.digest }
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAF6ED]">
      <div className="max-w-md w-full text-center bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="w-16 h-16 mx-auto bg-amber-100 text-[#9B111E] rounded-2xl flex items-center justify-center shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#D9531E] uppercase tracking-wider">Aapla Jalgaonwala</span>
          <h1 className="text-2xl font-black text-stone-900">Something Went Wrong</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            We are sorry for the disruption. An unexpected issue occurred while processing your request.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-stone-400">
              Error Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white text-xs font-bold hover:bg-[#800e19] transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        <div className="pt-4 border-t border-stone-100">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#9B111E] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Need assistance? Contact our team
          </Link>
        </div>
      </div>
    </div>
  );
}
