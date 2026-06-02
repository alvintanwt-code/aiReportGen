'use client';

import { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

export default function UploadArea({ onUpload, isLoading, shouldFlash }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    const isImage = file.type.startsWith('image/');
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    if (!isImage && !isCsv) {
      setError('Please upload an image (JPG, PNG) or CSV file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
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
    if (files && files[0]) handleFile(files[0]);
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) handleFile(files[0]);
  };

  const handleClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        className={[
          'dash-drop',
          dragActive ? 'is-dragging' : '',
          shouldFlash ? 'is-flashing' : '',
        ].filter(Boolean).join(' ')}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
            e.preventDefault();
            handleClick();
          }
        }}
        style={isLoading ? { cursor: 'wait', opacity: 0.85 } : undefined}
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
          <div className="dash-drop-loading">
            <div className="dash-spinner" />
            <div className="dash-drop-title">Extracting holdings…</div>
            <div className="dash-drop-meta">This usually takes a few seconds.</div>
          </div>
        ) : (
          <>
            <div className="dash-drop-icon">
              <Upload size={20} strokeWidth={2} />
            </div>
            <div className="dash-drop-title">Drop a portfolio file to extract holdings</div>
            <div className="dash-drop-sub">
              Drag and drop a portfolio screenshot or CSV statement, or click to browse.
            </div>
            <div className="dash-drop-meta">JPG, PNG, CSV · up to 10 MB</div>
          </>
        )}
      </div>

      {error && (
        <div className="dash-banner dash-banner-danger" style={{ marginTop: 12 }} role="alert">
          <span className="dash-banner-icon">
            <AlertCircle size={15} strokeWidth={2.2} />
          </span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
