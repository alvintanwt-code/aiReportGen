'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadArea from './UploadArea';

export default function FNAUploadView({ clientId, clientName, onUploadComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
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

      // Save to local storage temporarily
      sessionStorage.setItem(`fna_${clientId}`, JSON.stringify(extractedData));

      if (onUploadComplete) {
        onUploadComplete(extractedData);
      }

      // Navigate to FNA summary dashboard
      router.push(`/fna-summary?clientId=${clientId}`);
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError(error.message || 'Failed to extract data. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#101b3a', marginBottom: '8px' }}>
          Financial Needs Analysis
        </h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          Client: <strong>{clientName}</strong>
        </p>
        <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
          Upload up to 4 screenshots of the client's financial information including personal details, policies, assets, liabilities, and cashflow.
        </p>
      </div>

      {/* Upload Area */}
      <div style={{ marginBottom: '40px' }}>
        <UploadArea onFilesSelected={handleFilesSelected} maxFiles={4} label="Upload FNA Screenshots (Max 4)" />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '40px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#101b3a', marginBottom: '16px' }}>
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
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#333'
                }}
              >
                <span>
                  {index + 1}. {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button
                  onClick={() => removeFile(index)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
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
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '16px',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '13px'
        }}>
          ⚠️ {extractionError}
        </div>
      )}

      {/* Extract Button */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleExtract}
          disabled={uploadedFiles.length === 0 || isExtracting}
          style={{
            padding: '12px 32px',
            backgroundColor: uploadedFiles.length === 0 ? '#ccc' : '#FF8F44',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploadedFiles.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (uploadedFiles.length > 0) e.target.style.backgroundColor = '#FF7A1F';
          }}
          onMouseLeave={(e) => {
            if (uploadedFiles.length > 0) e.target.style.backgroundColor = '#FF8F44';
          }}
        >
          {isExtracting ? 'Extracting...' : 'Extract & Analyze'}
        </button>
      </div>
    </div>
  );
}
