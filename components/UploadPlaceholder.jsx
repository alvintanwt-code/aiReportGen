'use client';

export default function UploadPlaceholder({ onBack }) {
  console.log('[UploadPlaceholder] Rendered');

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Upload Page Coming in Phase 2</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        This is where you'll upload portfolio screenshots and extract holdings.
      </p>
      <button
        onClick={onBack}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
