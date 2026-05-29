'use client';

import { useRef, useState } from 'react';

export default function FNAUploadArea({ onFilesSelected, maxFiles = 4, label = 'Upload Files' }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      console.log('[FNAUploadArea] Files selected:', fileArray.length);
      onFilesSelected(fileArray);
    }
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
    console.log('[FNAUploadArea] Files dropped:', files.length);
    handleFiles(files);
  };

  const handleChange = (e) => {
    const files = e.target.files;
    console.log('[FNAUploadArea] Files selected via input:', files.length);
    handleFiles(files);
  };

  const handleClick = () => {
    console.log('[FNAUploadArea] Click to upload');
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
          border: '2px dashed ' + (dragActive ? '#FF8F44' : '#ddd'),
          borderRadius: '8px',
          padding: '40px 24px',
          textAlign: 'center',
          backgroundColor: dragActive ? '#fff3f0' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📸</div>
        <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#101b3a' }}>
          {label}
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
          Drag and drop your screenshots here, or click to select
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '12px' }}>
          Maximum {maxFiles} files • JPG, PNG supported
        </p>
      </div>
    </div>
  );
}
