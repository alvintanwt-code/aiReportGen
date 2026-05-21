'use client';

import { useState } from 'react';
import { extractPortfolioFromImage, extractPortfolioFromCSV } from '../lib/extractionService';

export default function ProgressiveOnboarding({
  onReviewCreated,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState([]);
  const [error, setError] = useState('');

  const handleNameContinue = () => {
    if (!clientName.trim()) {
      setError('Please enter a client name');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFilesSelected = async (files) => {
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    setStep(3);
    setIsExtracting(true);
    setExtractionStatus([]);

    // Process each file and extract
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const isImage = file.type.startsWith('image/');
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

      try {
        setExtractionStatus((prev) => [
          ...prev,
          { file: file.name, status: 'extracting', holdings: 0 },
        ]);

        let holdings;
        if (isImage) {
          holdings = await extractPortfolioFromImage(file);
        } else if (isCsv) {
          holdings = await extractPortfolioFromCSV(file);
        }

        setExtractionStatus((prev) =>
          prev.map((item) =>
            item.file === file.name
              ? { ...item, status: 'success', holdings: holdings?.length || 0 }
              : item
          )
        );
      } catch (err) {
        setExtractionStatus((prev) =>
          prev.map((item) =>
            item.file === file.name
              ? { ...item, status: 'error', message: err.message }
              : item
          )
        );
      }
    }

    setIsExtracting(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  };

  if (step === 1) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '12px' }}>Start New Portfolio Review</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>
            Who is this review for?
          </p>
        </div>

        <input
          type="text"
          placeholder="Client name (e.g., John Tan)"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNameContinue()}
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #d0d0d0',
            fontSize: '16px',
            marginBottom: '24px',
            fontFamily: 'inherit',
          }}
        />

        {error && (
          <p style={{ color: '#d32f2f', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleNameContinue}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Continue
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#f0f0f0',
              color: '#1a1a1a',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '12px' }}>Upload Portfolio Files</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>
            Drag and drop screenshots, statements, or PDF files
          </p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            border: '2px dashed #d0d0d0',
            borderRadius: '12px',
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            📁 Drop files here
          </p>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
            or click to browse
          </p>
          <input
            type="file"
            multiple
            accept="image/*,.csv,.pdf"
            onChange={(e) => handleFilesSelected(e.target.files)}
            style={{
              display: 'none',
              position: 'absolute',
            }}
            id="file-input"
          />
          <label
            htmlFor="file-input"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Select Files
          </label>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setStep(1)}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#f0f0f0',
              color: '#1a1a1a',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '12px' }}>Analyzing Files</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>
            AI is processing your portfolio data
          </p>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {extractionStatus.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                backgroundColor: '#f8f8f8',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: '500' }}>{item.file}</p>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      item.status === 'success'
                        ? '#e8f5e9'
                        : item.status === 'error'
                        ? '#ffebee'
                        : '#f5f5f5',
                    color:
                      item.status === 'success'
                        ? '#2e7d32'
                        : item.status === 'error'
                        ? '#c62828'
                        : '#999',
                  }}
                >
                  {item.status === 'success'
                    ? `✓ ${item.holdings} holdings`
                    : item.status === 'error'
                    ? '✗ Error'
                    : 'Extracting...'}
                </span>
              </div>
              {item.message && (
                <p style={{ fontSize: '12px', color: '#d32f2f' }}>
                  {item.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {!isExtracting && (
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                const hasSuccessfulExtractions = extractionStatus.some(
                  (item) => item.status === 'success'
                );
                if (hasSuccessfulExtractions) {
                  onReviewCreated(clientName, uploadedFiles);
                }
              }}
              disabled={!extractionStatus.some((item) => item.status === 'success')}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: extractionStatus.some((item) => item.status === 'success')
                  ? '#1a1a1a'
                  : '#ccc',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: extractionStatus.some((item) => item.status === 'success')
                  ? 'pointer'
                  : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Continue to Review
            </button>
          </div>
        )}
      </div>
    );
  }
}
