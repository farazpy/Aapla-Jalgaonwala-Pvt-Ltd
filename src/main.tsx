import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Global resilience handler for cross-origin third-party script events (e.g., Google GSI, Translate, Razorpay)
if (typeof window !== 'undefined') {
  window.onerror = function (msg, url) {
    if (msg === 'Script error.' || msg === 'Script error' || !url) {
      return true;
    }
  };

  window.addEventListener('error', (event) => {
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
