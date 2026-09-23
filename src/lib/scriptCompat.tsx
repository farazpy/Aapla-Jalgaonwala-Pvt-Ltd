import React, { useEffect, useRef } from 'react';

export interface ScriptProps {
  src?: string;
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
  onLoad?: () => void;
  onError?: (e: any) => void;
  id?: string;
  children?: string;
  async?: boolean;
  defer?: boolean;
}

export function Script({ src, id, children, onLoad, onError }: ScriptProps) {
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  useEffect(() => {
    if (!src && !children) return;

    if (id && document.getElementById(id)) return;

    const script = document.createElement('script');
    if (id) script.id = id;
    if (src) script.src = src;
    script.async = true;

    if (children) {
      script.innerHTML = children;
    }

    script.onload = () => {
      onLoadRef.current?.();
    };
    script.onerror = (e) => {
      onErrorRef.current?.(e);
    };

    document.body.appendChild(script);

    return () => {
      // Optional cleanup
    };
  }, [src, id, children]);

  return null;
}

export default Script;
