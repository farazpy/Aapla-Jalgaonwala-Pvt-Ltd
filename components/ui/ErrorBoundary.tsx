'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { ClientLogger } from '@/lib/clientLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    ClientLogger.error(error, {
      module: this.props.moduleName || 'ErrorBoundary',
      metadata: { componentStack: errorInfo.componentStack }
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 md:p-10 my-6 max-w-xl mx-auto bg-amber-50/80 border border-amber-200/80 rounded-3xl text-center shadow-xs">
          <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 text-[#9B111E] rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-stone-900 mb-1">Something unexpected occurred</h3>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            We encountered a temporary issue while loading this section. Our team has been notified.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9B111E] text-white text-xs font-bold hover:bg-[#800e19] transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Return Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
