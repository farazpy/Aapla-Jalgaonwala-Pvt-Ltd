'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ClientLogger } from '@/lib/clientLogger';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    ClientLogger.error(error, {
      module: 'GlobalError',
      metadata: { digest: error.digest }
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FAF6ED] min-h-screen flex items-center justify-center p-4 font-sans text-stone-900">
        <div className="max-w-md w-full text-center bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="w-16 h-16 mx-auto bg-amber-100 text-[#9B111E] rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-stone-900">Application Error</h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              A critical issue occurred. Please click below to refresh the application.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white text-xs font-bold hover:bg-[#800e19] transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
