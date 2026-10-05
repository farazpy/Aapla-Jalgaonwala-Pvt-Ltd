import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);

    // Auto-recover if a stale module script or chunk failure occurred
    const errorStr = (error?.message || String(error || '')).toLowerCase();
    const isModuleOrChunkError =
      errorStr.includes('failed to load module script') ||
      errorStr.includes('mime type') ||
      errorStr.includes('dynamically imported module') ||
      errorStr.includes('loading chunk') ||
      errorStr.includes('error loading');

    if (isModuleOrChunkError && typeof window !== 'undefined') {
      const reloadKey = 'ajw_chunk_reload_ts';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      // Reload automatically if not reloaded in the last 10 seconds
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorStr = (this.state.error?.message || String(this.state.error || '')).toLowerCase();
      const isModuleOrChunkError =
        errorStr.includes('failed to load module script') ||
        errorStr.includes('mime type') ||
        errorStr.includes('dynamically imported module') ||
        errorStr.includes('loading chunk') ||
        errorStr.includes('error loading');

      return (
        <div className="py-16 px-4 max-w-lg mx-auto text-center bg-white rounded-3xl border border-red-100 shadow-sm my-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-stone-900 mb-2">
            {isModuleOrChunkError ? 'New Version Available' : 'Something went wrong'}
          </h3>
          <p className="text-xs text-stone-500 mb-6">
            {isModuleOrChunkError
              ? 'The application has been updated with a newer version. Please refresh the page to load the latest components.'
              : 'We encountered a temporary issue while loading this section.'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#9B111E] text-white text-xs font-bold shadow-xs hover:bg-[#800A14] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isModuleOrChunkError ? 'Refresh Application' : 'Reload Section'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
