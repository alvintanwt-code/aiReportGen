'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FNAUploadArea from './FNAUploadArea';

export default function FNAUploadView({ clientId, clientName, onUploadComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const router = useRouter();

  // Design tokens from project instructions
  const TOKENS = {
    bg: '#f6f8fa',
    surface: '#ffffff',
    surface2: '#f9fafb',
    border: '#e5e7eb',
    borderSoft: '#f0f2f4',
    inkPrimary: '#0f172a',
    inkSecondary: '#475569',
    inkTertiary: '#94a3b8',
    inkMuted: '#cbd5e1',
    brand: '#635bff',
    positive: '#10b981',
    warning: '#f59e0b',
    negative: '#ef4444',
    shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  };

  const handleFilesSelected = (files) => {
    setUploadedFiles([...uploadedFiles, ...Array.from(files)]);
    setExtractionError('');
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    if (uploadedFiles.length === 0) {
      setExtractionError('Please upload at least 1 screenshot');
      return;
    }

    setIsExtracting(true);
    setExtractionError('');

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file, index) => {
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

      if (onUploadComplete) {
        onUploadComplete(responseData);
      }

      setTimeout(() => {
        router.push(`/fna-summary?clientId=${clientId}`);
      }, 1500);
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError(error.message || 'Failed to extract data. Please try again.');
      setIsExtracting(false);
    }
  };

  if (isExtracting && !isComplete) {
    return (
      <div style={{ backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          @import url('https://rsms.me/inter/inter.css');
          body { background-color: ${TOKENS.bg}; margin: 0; }
          * { box-sizing: border-box; }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .loading-pulse { animation: pulse 2s ease-in-out infinite; }
        `}</style>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '32px' }} className="loading-pulse">⚡</div>
          <h2 style={{
            fontSize: '26px',
            fontWeight: '700',
            color: TOKENS.inkPrimary,
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em'
          }}>
            Analyzing your data
          </h2>
          <p style={{
            fontSize: '13px',
            color: TOKENS.inkSecondary,
            margin: '0',
            lineHeight: '1.65'
          }}>
            This will take a moment. Processing your financial information...
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div style={{ backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          @import url('https://rsms.me/inter/inter.css');
          body { background-color: ${TOKENS.bg}; margin: 0; }
          * { box-sizing: border-box; }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .slide-in { animation: slideInUp 0.4s ease-out; }
        `}</style>

        <div style={{ textAlign: 'center' }} className="slide-in">
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
          <h2 style={{
            fontSize: '26px',
            fontWeight: '700',
            color: TOKENS.positive,
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}>
            Analysis complete
          </h2>
          <p style={{
            fontSize: '13px',
            color: TOKENS.inkSecondary,
            margin: '0',
            lineHeight: '1.65'
          }}>
            Preparing your financial summary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://rsms.me/inter/inter.css');
        body { background-color: ${TOKENS.bg}; margin: 0; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 16px',
            backgroundColor: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            color: TOKENS.inkSecondary,
            marginBottom: '48px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = TOKENS.surface2;
            e.target.style.borderColor = TOKENS.borderSoft;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = TOKENS.surface;
            e.target.style.borderColor = TOKENS.border;
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Page Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: TOKENS.inkPrimary,
            marginBottom: '12px'
          }}>
            Financial Needs Analysis
          </h1>
          <p style={{
            fontSize: '13px',
            fontWeight: '500',
            color: TOKENS.inkSecondary,
            margin: '0',
            lineHeight: '1.65'
          }}>
            {clientName} • Upload up to 4 screenshots of financial information
          </p>
        </div>

        {/* Upload Instructions */}
        <div style={{
          backgroundColor: TOKENS.surface,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: TOKENS.shadowSm
        }}>
          <p style={{
            fontSize: '13px',
            color: TOKENS.inkSecondary,
            lineHeight: '1.65',
            margin: '0'
          }}>
            Upload screenshots showing personal details, policies, assets, liabilities, and monthly cashflow. We'll extract and analyze the data automatically.
          </p>
        </div>

        {/* Upload Area */}
        <div style={{ marginBottom: '32px' }}>
          <FNAUploadArea onFilesSelected={handleFilesSelected} maxFiles={4} label="Upload FNA Screenshots" />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div style={{
            backgroundColor: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: TOKENS.shadowSm
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: TOKENS.inkTertiary,
              letterSpacing: '0.07em',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Uploaded Files ({uploadedFiles.length}/4)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: TOKENS.surface2,
                    border: `1px solid ${TOKENS.borderSoft}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: TOKENS.inkSecondary
                  }}
                >
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: TOKENS.negative,
                      border: `1px solid ${TOKENS.negative}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = TOKENS.negative;
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = TOKENS.negative;
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {extractionError && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: `1px solid ${TOKENS.negative}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px',
            fontSize: '13px',
            color: TOKENS.negative,
            display: 'flex',
            gap: '12px'
          }}>
            <span style={{ fontWeight: '600' }}>⚠</span>
            <span>{extractionError}</span>
          </div>
        )}

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={uploadedFiles.length === 0}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: uploadedFiles.length === 0 ? TOKENS.borderSoft : TOKENS.brand,
            color: uploadedFiles.length === 0 ? TOKENS.inkMuted : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: uploadedFiles.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.15s',
            opacity: uploadedFiles.length === 0 ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (uploadedFiles.length > 0) {
              e.target.style.backgroundColor = '#5348dd';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = TOKENS.shadowMd;
            }
          }}
          onMouseLeave={(e) => {
            if (uploadedFiles.length > 0) {
              e.target.style.backgroundColor = TOKENS.brand;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          {isExtracting ? '⏳ Extracting...' : '✓ Extract & Analyze'}
        </button>
      </div>
    </div>
  );
}
