import React, { lazy, Suspense } from 'react';

const MapView = lazy(() => import('./MapView'));

export default function LazyMapView({ height = '400px', ...props }) {
  return (
    <Suspense
      fallback={
        <div
          aria-label="Loading map"
          className="w-full animate-pulse rounded-xl bg-slate-100"
          style={{ height }}
        />
      }
    >
      <MapView height={height} {...props} />
    </Suspense>
  );
}
