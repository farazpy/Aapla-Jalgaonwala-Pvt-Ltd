import React, { lazy, Suspense } from 'react';

interface DynamicOptions {
  loading?: React.ComponentType<any> | (() => React.ReactNode);
  ssr?: boolean;
}

export function dynamic<T extends React.ComponentType<any>>(
  loader: () => Promise<T | { default: T } | { [key: string]: T }>,
  options?: DynamicOptions
) {
  const LazyComponent = lazy(async () => {
    const mod: any = await loader();
    if (mod && mod.default) {
      return { default: mod.default };
    }
    // If named export
    if (mod && typeof mod === 'object') {
      const keys = Object.keys(mod);
      if (keys.length > 0) {
        return { default: mod[keys[0]] };
      }
    }
    return { default: mod };
  });

  const LoadingFallback = options?.loading || (() => null);

  return function DynamicComponent(props: any) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export default dynamic;
