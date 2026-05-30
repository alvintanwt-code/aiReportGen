'use client';

import { Suspense } from 'react';
import FNASummaryViewContent from './content';

export default function FNASummaryViewPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading summary...</p>
        </div>
      }
    >
      <FNASummaryViewContent />
    </Suspense>
  );
}
