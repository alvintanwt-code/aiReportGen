'use client';

import { ArrowLeft } from 'lucide-react';

export default function UploadPlaceholder({ onBack }) {
  return (
    <div className="dash-root dash-upload">
      <div className="dash-upload-body no-rail">
        <div className="dash-panel" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div className="dash-h2">Upload coming in phase 2</div>
          <p className="dash-section-sub" style={{ marginTop: 8, marginBottom: 20 }}>
            This is where you'll upload portfolio screenshots and extract holdings.
          </p>
          <button className="dash-btn dash-btn-ghost" onClick={onBack}>
            <ArrowLeft size={14} strokeWidth={2.2} />
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
