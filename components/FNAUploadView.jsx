'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Check, X as XIcon, AlertCircle, FileImage } from 'lucide-react';
import FNAUploadArea from './FNAUploadArea';

/**
 * Client-side image downsize before upload.
 *
 * Anthropic's vision endpoint auto-resizes any image with a long edge above
 * ~1568px, so sending high-res screenshots costs upload bandwidth + Vercel
 * body-size quota without giving the model more pixels to look at. We pre-empt
 * that here: anything bigger than `maxEdge` gets canvas-resized and re-encoded
 * as quality-0.88 JPEG. Smaller images pass through untouched; non-images and
 * any failure fall back to the original file.
 */
async function downsizeImage(file, maxEdge = 1600) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);
    if (longEdge <= maxEdge) {
      bitmap.close?.();
      return file;
    }
    const scale = maxEdge / longEdge;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) return file;
    const newName = file.name.replace(/\.\w+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.warn('[downsizeImage] fell back to original:', err);
    return file;
  }
}

export default function FNAUploadView({ clientId, clientName, onUploadComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const router = useRouter();

  const handleFilesSelected = (files) => {
    setUploadedFiles([...uploadedFiles, ...Array.from(files)]);
    setExtractionError('');
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    if (uploadedFiles.length === 0) {
      setExtractionError('Please upload at least one screenshot.');
      return;
    }
    setIsExtracting(true);
    setExtractionError('');

    try {
      // Downsize all images in parallel before building the upload body.
      const resizedFiles = await Promise.all(uploadedFiles.map((f) => downsizeImage(f)));

      const formData = new FormData();
      resizedFiles.forEach((file, index) => {
        formData.append(`screenshot${index + 1}`, file);
      });
      formData.append('clientId', clientId);
      formData.append('analysisType', 'fna');

      const response = await fetch('/api/extract-fna', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Extraction failed: ${response.statusText}`);
      }

      setIsComplete(true);
      sessionStorage.setItem(`fna_${clientId}`, JSON.stringify(responseData));
      if (onUploadComplete) onUploadComplete(responseData);

      setTimeout(() => {
        router.push(`/fna-summary?clientId=${clientId}`);
      }, 1400);
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError(error.message || 'Failed to extract data. Please try again.');
      setIsExtracting(false);
    }
  };

  if (isExtracting && !isComplete) {
    return (
      <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="dash-status">
          <div className="dash-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <div className="dash-status-title">Analysing your data</div>
          <div className="dash-section-sub" style={{ marginBottom: 0 }}>
            Processing your financial information. This usually takes a moment.
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="dash-status">
          <div className="dash-status-icon is-success">
            <Check size={28} strokeWidth={2.6} />
          </div>
          <div className="dash-status-title">Analysis complete</div>
          <div className="dash-section-sub" style={{ marginBottom: 0 }}>
            Preparing your financial summary…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-root dash-upload">
      <header className="dash-upload-header">
        <div className="dash-upload-header-left">
          <button className="dash-back" onClick={() => router.push('/')}>
            <ArrowLeft size={14} strokeWidth={2.2} />
            Dashboard
          </button>
          <div className="dash-crumbs">
            <span className="dash-crumb">{clientName || 'Client'}</span>
            <span className="dash-crumb-sep">·</span>
            <span className="dash-crumb dash-crumb-current">Financial needs analysis</span>
          </div>
        </div>
      </header>

      <div className="dash-upload-body no-rail">
        <main>
          <h1 className="dash-h1" style={{ marginBottom: 6 }}>Financial needs analysis</h1>
          <p className="dash-section-sub">
            Upload up to 4 screenshots covering personal details, policies, assets, liabilities, and monthly cashflow. We'll extract and analyse the data automatically.
          </p>

          <FNAUploadArea
            onFilesSelected={handleFilesSelected}
            maxFiles={4}
            label="Upload FNA screenshots"
          />

          {uploadedFiles.length > 0 && (
            <section className="dash-panel" style={{ padding: 0, marginTop: 20, overflow: 'hidden' }}>
              <header className="dash-panel-header">
                <div className="dash-eyebrow">Uploaded files ({uploadedFiles.length}/4)</div>
              </header>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 20px',
                      borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--accent-50)',
                        color: 'var(--accent-600)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}>
                        <FileImage size={15} strokeWidth={2} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={() => removeFile(index)}
                      style={{ height: 30, padding: '0 10px', fontSize: 12.5 }}
                      aria-label={`Remove ${file.name}`}
                    >
                      <XIcon size={13} strokeWidth={2.4} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {extractionError && (
            <div className="dash-banner dash-banner-danger" style={{ marginTop: 20 }} role="alert">
              <span className="dash-banner-icon">
                <AlertCircle size={15} strokeWidth={2.2} />
              </span>
              <span>{extractionError}</span>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="dash-btn dash-btn-generate"
              onClick={handleExtract}
              disabled={uploadedFiles.length === 0 || isExtracting}
              style={uploadedFiles.length === 0 ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
            >
              <Sparkles size={14} strokeWidth={2.2} />
              {isExtracting ? 'Extracting…' : 'Extract & analyse'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
