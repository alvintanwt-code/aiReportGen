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

  // Design tokens
  const COLORS = {
    navy: '#1e3a5f',
    offWhite: '#f9f7f5',
    taupe: '#8b8680',
    forestGreen: '#2d5016',
    gold: '#d4af37',
    softRed: '#c85c5c',
    warmGray: '#9a9a8f',
    mutedGray: '#b5b5aa',
    border: 'rgba(30, 58, 95, 0.08)',
    borderStrong: 'rgba(30, 58, 95, 0.12)',
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

      const extractedData = responseData;

      // Show completion animation
      setIsComplete(true);

      // Save to session storage temporarily
      sessionStorage.setItem(`fna_${clientId}`, JSON.stringify(extractedData));

      if (onUploadComplete) {
        onUploadComplete(extractedData);
      }

      // Wait for animation before navigating
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
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '40px 24px', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkmark {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .slide-in { animation: slideDown 0.5s ease-out; }
        .checkmark-icon { animation: checkmark 0.6s ease-out; color: ${COLORS.forestGreen}; }
        .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
        body { background-color: ${COLORS.offWhite}; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          backgroundColor: 'white',
          border: `1px solid ${COLORS.border}`,
          borderRadius: '22px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: COLORS.navy,
          marginBottom: '40px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = COLORS.offWhite;
          e.target.style.borderColor = COLORS.borderStrong;
          e.target.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.borderColor = COLORS.border;
          e.target.style.transform = 'translateX(0)';
        }}
      >
        ← Back to Home
      </button>

      {/* Loading State */}
      {isExtracting && !isComplete ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px', opacity: 0.8 }} className="loading-pulse">✨</div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: 'Georgia, serif',
              color: COLORS.navy,
              marginBottom: '12px',
              margin: '0 0 12px 0'
            }}>
              Analyzing Financial Data
            </h2>
            <p style={{ fontSize: '16px', color: COLORS.warmGray, marginBottom: '8px', margin: '0 0 8px 0' }}>
              This will take a moment...
            </p>
            <p style={{ fontSize: '13px', color: COLORS.mutedGray, margin: '0' }}>
              We're processing your financial information with AI
            </p>
          </div>
        </div>
      ) : isComplete ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }} className="slide-in">
            <div style={{ fontSize: '80px', marginBottom: '24px' }} className="checkmark-icon">✅</div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: 'Georgia, serif',
              color: COLORS.forestGreen,
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Analysis Complete!
            </h2>
            <p style={{ fontSize: '16px', color: COLORS.warmGray, margin: '0' }}>
              Preparing your financial needs analysis...
            </p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }} className="slide-in">
            <h1 style={{
              fontSize: '40px',
              fontWeight: '700',
              fontFamily: 'Georgia, serif',
              color: COLORS.navy,
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Financial Needs Analysis
            </h1>
            <p style={{ fontSize: '16px', color: COLORS.warmGray, marginBottom: '12px', margin: '0 0 12px 0' }}>
              Client: <strong style={{ color: COLORS.navy }}>{clientName}</strong>
            </p>
            <p style={{ fontSize: '14px', color: COLORS.warmGray, lineHeight: '1.6', maxWidth: '600px', margin: '0' }}>
              Upload up to 4 screenshots of the client's financial information including personal details, policies, assets, liabilities, and cashflow.
            </p>
          </div>

          {/* Upload Area */}
          <div style={{ marginBottom: '40px' }}>
            <FNAUploadArea onFilesSelected={handleFilesSelected} maxFiles={4} label="Upload FNA Screenshots (Max 4)" />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '40px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: COLORS.navy,
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>
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
                      padding: '12px 16px',
                      backgroundColor: COLORS.offWhite,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: COLORS.navy
                    }}
                  >
                    <span>
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: COLORS.softRed,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#a84949'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.softRed}
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
              backgroundColor: 'rgba(200, 92, 92, 0.08)',
              border: `1px solid ${COLORS.softRed}`,
              color: COLORS.softRed,
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
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
              padding: '14px 48px',
              backgroundColor: uploadedFiles.length === 0 ? COLORS.mutedGray : COLORS.navy,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: uploadedFiles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              opacity: uploadedFiles.length === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (uploadedFiles.length > 0) {
                e.target.style.backgroundColor = '#162d47';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (uploadedFiles.length > 0) {
                e.target.style.backgroundColor = COLORS.navy;
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {isExtracting ? '⏳ Extracting...' : '✨ Extract & Analyze'}
          </button>
        </div>
      )}
    </div>
  );
}
