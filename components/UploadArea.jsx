'use client';

import { useRef, useState } from 'react';

export default function UploadArea({ onUpload, isLoading, shouldFlash }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  console.log('[UploadArea] Rendered, isLoading:', isLoading);

  const handleFile = async (file) => {
    console.log('[UploadArea] handleFile:', file.name);

    // Check if it's an image or CSV file
    const isImage = file.type.startsWith('image/');
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    if (!isImage && !isCsv) {
      setError('Please upload an image file (JPG, PNG) or CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    await onUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      console.log('[UploadArea] File dropped:', files[0].name);
      handleFile(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      console.log('[UploadArea] File selected:', files[0].name);
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    console.log('[UploadArea] Click to upload');
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: '2px dashed ' + (dragActive ? '#007bff' : '#888888'),
          borderRadius: '45px',
          padding: '40px',
          textAlign: 'center',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.15) 2px, rgba(255, 255, 255, 0.15) 4px)',
          backgroundColor: dragActive ? 'rgba(232, 244, 248, 0.05)' : 'rgba(255, 255, 255, 0.05)',
          cursor: isLoading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1,
          animation: shouldFlash ? 'uploadGlow 0.7s ease-out' : 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.csv"
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={isLoading}
        />

        {isLoading ? (
          <div>
            <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
              Extracting portfolio holdings...
            </p>
            <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
              This may take a moment
            </p>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
              📸 Upload Portfolio (Screenshot or CSV)
            </p>
            <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
              Drag and drop your file here, or click to select
            </p>
            <p style={{ margin: '10px 0 0 0', color: '#999', fontSize: '12px' }}>
              Supported: JPG, PNG, CSV (max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p
          style={{
            color: '#dc3545',
            marginTop: '10px',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
