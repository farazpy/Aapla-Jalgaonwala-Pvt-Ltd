import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Global resilience handler for cross-origin third-party script events (e.g., Google GSI, Translate, Razorpay)
if (typeof window !== 'undefined') {
  // Auto-recover from stale chunks after a new deployment
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const reloadKey = 'ajw_last_chunk_reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 8000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  });

  window.onerror = function (msg, url) {
    if (msg === 'Script error.' || msg === 'Script error' || !url) {
      return true;
    }
    const strMsg = String(msg || '');
    if (
      strMsg.includes('Failed to load module script') ||
      strMsg.includes('MIME type') ||
      strMsg.includes('JavaScript-or-Wasm module script') ||
      strMsg.includes('error loading dynamically imported module')
    ) {
      const reloadKey = 'ajw_last_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 8000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }
  };

  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement | null;
    const isScriptTag = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK');
    const msg = event.message || (event as any).error?.message || '';
    if (
      msg.includes('Failed to load module script') ||
      msg.includes('MIME type') ||
      msg.includes('JavaScript-or-Wasm module script') ||
      msg.includes('dynamically imported module') ||
      (isScriptTag && event.error)
    ) {
      const reloadKey = 'ajw_last_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 8000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }

    if (event.message === 'Script error.' || event.message === 'Script error' || !event.filename) {
      // Cross-origin script error from external CDN/script - safe to ignore
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (reason.includes('dynamically imported module') || reason.includes('Failed to load module script')) {
      const reloadKey = 'ajw_last_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 8000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }
    if (reason.includes('ResizeObserver') || reason.includes('Script error')) {
      event.preventDefault();
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
