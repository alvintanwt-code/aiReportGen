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

  // BRUTALIST COLORS
  const COLORS = {
    grey: '#e8e8e8',
    white: '#ffffff',
    black: '#000000',
    darkGrey: '#333333',
    navy: '#1e3a5f',
    border: '#cccccc',
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

  return (
    <div style={{ backgroundColor: COLORS.grey, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .slide-in { animation: slideDown 0.5s ease-out; }
        .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
        body { background-color: ${COLORS.grey}; margin: 0; }
        * { box-sizing: border-box; }
        h1, h2 { margin: 0; font-weight: 900; }
        p { margin: 0; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          style={{
            alignSelf: 'flex-start',
            padding: '12px 24px',
            backgroundColor: COLORS.white,
            border: `2px solid ${COLORS.black}`,
            borderRadius: '0px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: '60px',
            transition: 'all 0.1s',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = COLORS.black;
            e.target.style.color = COLORS.white;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = COLORS.white;
            e.target.style.color = COLORS.black;
          }}
        >
          ← Back
        </button>

        {/* Loading State */}
        {isExtracting && !isComplete ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '32px' }} className="loading-pulse">✨</div>
              <h2 style={{ fontSize: '36px', color: COLORS.black, marginBottom: '16px' }}>
                ANALYZING DATA
              </h2>
              <p style={{ fontSize: '14px', color: COLORS.darkGrey, marginBottom: '8px' }}>
                This will take a moment
              </p>
              <p style={{ fontSize: '12px', color: COLORS.darkGrey }}>
                Processing your financial information
              </p>
            </div>
          </div>
        ) : isComplete ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }} className="slide-in">
              <div style={{ fontSize: '80px', marginBottom: '32px' }}>✅</div>
              <h2 style={{ fontSize: '36px', color: COLORS.navy, marginBottom: '12px' }}>
                ANALYSIS COMPLETE
              </h2>
              <p style={{ fontSize: '14px', color: COLORS.darkGrey }}>
                Preparing your financial summary
              </p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            {/* Header */}
            <div style={{ marginBottom: '60px' }} className="slide-in">
              <h1 style={{ fontSize: '48px', color: COLORS.black, marginBottom: '16px' }}>
                FINANCIAL NEEDS ANALYSIS
              </h1>
              <p style={{ fontSize: '14px', color: COLORS.darkGrey, marginBottom: '12px', fontWeight: '600' }}>
                CLIENT: {clientName?.toUpperCase()}
              </p>
              <p style={{ fontSize: '13px', color: COLORS.darkGrey, lineHeight: '1.7', maxWidth: '700px' }}>
                Upload up to 4 screenshots of the client's financial information: personal details, policies, assets, liabilities, and cashflow.
              </p>
            </div>

            {/* Upload Area */}
            <div style={{ marginBottom: '60px' }}>
              <FNAUploadArea onFilesSelected={handleFilesSelected} maxFiles={4} label="Upload FNA Screenshots (Max 4)" />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div style={{
                backgroundColor: COLORS.white,
                border: `2px solid ${COLORS.black}`,
                borderRadius: '0px',
                padding: '32px',
                marginBottom: '60px'
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.black, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Uploaded Files ({uploadedFiles.length}/4)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: COLORS.grey,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '0px',
                        fontSize: '13px',
                        color: COLORS.darkGrey
                      }}
                    >
                      <span style={{ fontFamily: 'monospace' }}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: COLORS.black,
                          color: COLORS.white,
                          border: 'none',
                          borderRadius: '0px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '700',
                          transition: 'all 0.1s',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
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
                backgroundColor: COLORS.white,
                border: `2px solid ${COLORS.black}`,
                color: COLORS.black,
                padding: '16px',
                borderRadius: '0px',
                marginBottom: '32px',
                fontSize: '13px'
              }}>
                ⚠️ {extractionError}
              </div>
            )}

            {/* Extract Button */}
            <button
              onClick={handleExtract}
              disabled={uploadedFiles.length === 0}
              style={{
                padding: '16px 40px',
                backgroundColor: uploadedFiles.length === 0 ? COLORS.border : COLORS.navy,
                color: COLORS.white,
                border: `3px solid ${uploadedFiles.length === 0 ? COLORS.border : COLORS.navy}`,
                borderRadius: '0px',
                cursor: uploadedFiles.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '900',
                transition: 'all 0.1s',
                opacity: uploadedFiles.length === 0 ? 0.5 : 1,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
              onMouseEnter={(e) => {
                if (uploadedFiles.length > 0) {
                  e.target.style.backgroundColor = COLORS.white;
                  e.target.style.color = COLORS.navy;
                }
              }}
              onMouseLeave={(e) => {
                if (uploadedFiles.length > 0) {
                  e.target.style.backgroundColor = COLORS.navy;
                  e.target.style.color = COLORS.white;
                }
              }}
            >
              {isExtracting ? '⏳ EXTRACTING...' : '✨ EXTRACT & ANALYZE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
