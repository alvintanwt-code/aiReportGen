'use client';

import { useRef, useState } from 'react';
import { Images } from 'lucide-react';

export default function FNAUploadArea({ onFilesSelected, maxFiles = 4, label = 'Upload screenshots' }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) onFilesSelected(fileArray);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => handleFiles(e.target.files);
  const handleClick = () => fileInputRef.current?.click();

  return (
    <div
      className={`dash-drop ${dragActive ? 'is-dragging' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
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
      <div className="dash-drop-icon">
        <Images size={20} strokeWidth={2} />
      </div>
      <div className="dash-drop-title">{label}</div>
      <div className="dash-drop-sub">Drag screenshots here, or click to browse.</div>
      <div className="dash-drop-meta">Up to {maxFiles} files · JPG or PNG</div>
    </div>
  );
}
