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

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`);
      }

      const extractedData = await response.json();

      // Show completion animation
      setIsComplete(true);

      // Save to local storage temporarily
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
    <div className="gradient-northern-lights" style={{ minHeight: '100vh', padding: '40px 24px', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .slide-in {
          animation: slideDown 0.5s ease-out;
        }
        .checkmark-icon {
          animation: checkmark 0.6s ease-out;
          color: #16a34a;
        }
        .loading-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '22px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1a1a1a',
          marginBottom: '40px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          e.target.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'translateX(0)';
        }}
      >
        ← Back to Home
      </button>

      {/* Loading State */}
      {isExtracting && !isComplete ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px', opacity: 0.8 }}>✨</div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>
              Analyzing Financial Data
            </h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px', className: 'loading-pulse' }}>
              This will take a moment...
            </p>
            <p style={{ fontSize: '13px', color: '#999' }}>
              We're processing your financial information with AI
            </p>
          </div>
        </div>
      ) : isComplete ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', className: 'slide-in' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px', className: 'checkmark-icon' }}>✅</div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
              Analysis Complete!
            </h2>
            <p style={{ fontSize: '16px', color: '#666' }}>
              Preparing your financial needs analysis...
            </p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: '40px', className: 'slide-in' }}>
            <h1 style={{ fontSize: '40px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
              Financial Needs Analysis
            </h1>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              Client: <strong style={{ color: '#1a1a1a' }}>{clientName}</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', maxWidth: '600px' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '40px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>
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
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#333'
                    }}
                  >
                    <span>
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
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
              backgroundColor: 'rgba(248, 215, 218, 0.9)',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '13px',
              backdropFilter: 'blur(10px)'
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
              backgroundColor: uploadedFiles.length === 0 ? 'rgba(200, 200, 200, 0.5)' : '#FF8F44',
              color: 'white',
              border: 'none',
              borderRadius: '22px',
              cursor: uploadedFiles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: uploadedFiles.length === 0 ? 'none' : '0 8px 32px rgba(255, 143, 68, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (uploadedFiles.length > 0) {
                e.target.style.backgroundColor = '#FF7A1F';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 40px rgba(255, 143, 68, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (uploadedFiles.length > 0) {
                e.target.style.backgroundColor = '#FF8F44';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(255, 143, 68, 0.3)';
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
