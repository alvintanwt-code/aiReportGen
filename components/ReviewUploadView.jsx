'use client';

import { useState, useEffect } from 'react';
import UploadArea from './UploadArea';
import MultipleHoldingsSets from './MultipleHoldingsSets';
import ReportDetailsForm from './ReportDetailsForm';
import { extractPortfolioFromImage, extractPortfolioFromCSV } from '../lib/extractionService';
import { recalculatePortfolio } from '../lib/portfolioCalculations';
import { downloadReport, openReportInNewWindow } from '../lib/reportGenerationService';

// UUID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ReviewUploadView({
  review,
  clientName,
  onSaveHoldings,
  onUpdateReviewName,
  onBack,
  reviews = [],
  selectedClientId,
  onSelectReview,
}) {
  const [holdingsSets, setHoldingsSets] = useState(review.holdingsSets || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [showErrorState, setShowErrorState] = useState(false);
  const [pendingHoldings, setPendingHoldings] = useState(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [shouldFlashUpload, setShouldFlashUpload] = useState(false);
  const [reviewName, setReviewName] = useState(review.reviewName || '');
  const [isEditingReviewName, setIsEditingReviewName] = useState(false);
  const [showReviewNamePrompt, setShowReviewNamePrompt] = useState(!review.reviewName);
  const [showReportForm, setShowReportForm] = useState(false);

  // Update state when review prop changes
  useEffect(() => {
    console.log('[ReviewUploadView] Review prop changed, updating state:', review.id);
    setHoldingsSets(review.holdingsSets || []);
    setReviewName(review.reviewName || '');
    setIsEditingReviewName(false);
  }, [review.id]);

  // Check if this is a past review (status='extracted' with saved holdings) or new review
  const isPastReview = review.status === 'extracted' && review.holdingsSets && review.holdingsSets.length > 0;

  // Generate suggested review name (e.g., Q1 2026)
  const getQuarterSuggestion = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter} ${year}`;
  };

  console.log('[ReviewUploadView] Rendered for review:', review.id, 'holdingsSets:', holdingsSets.length);

  // Transition from success state to naming state after delay
  useEffect(() => {
    if (showSuccessState) {
      const timer = setTimeout(() => {
        setShowSuccessState(false);
        setShowNamePrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessState]);

  const handleUpload = async (file) => {
    console.log('[ReviewUploadView] handleUpload called with file:', file.name);

    setIsLoading(true);
    setError('');

    try {
      // Detect file type and call appropriate extraction service
      const isImage = file.type.startsWith('image/');
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

      let extractedHoldings;
      if (isImage) {
        console.log('[ReviewUploadView] Extracting from image');
        extractedHoldings = await extractPortfolioFromImage(file);
      } else if (isCsv) {
        console.log('[ReviewUploadView] Extracting from CSV');
        extractedHoldings = await extractPortfolioFromCSV(file);
      } else {
        throw new Error('Unsupported file type');
      }

      console.log('[ReviewUploadView] Got extracted holdings:', extractedHoldings);

      // Recalculate with initial values
      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(extractedHoldings);

      console.log('[ReviewUploadView] Recalculated portfolio, total:', total);

      setPendingHoldings(recalculatedHoldings);
      setPortfolioName('');
      setShowSuccessState(true);
      setIsLoading(false);
    } catch (err) {
      console.error('[ReviewUploadView] Error during extraction:', err);
      setError(`Failed to extract portfolio holdings: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleAddPortfolio = () => {
    console.log('[ReviewUploadView] Adding portfolio with name:', portfolioName);

    if (!pendingHoldings) {
      setShowErrorState(true);
      setTimeout(() => {
        setShowErrorState(false);
      }, 2800);
      return;
    }

    if (!portfolioName.trim()) {
      setError('Please enter a portfolio name (e.g., HSBC, AIA)');
      return;
    }

    const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
      recalculatePortfolio(pendingHoldings);

    const newSet = {
      id: generateId(),
      name: portfolioName,
      holdings: recalculatedHoldings,
      totalPortfolioValueSgd: total,
    };

    setHoldingsSets([...holdingsSets, newSet]);
    setShowNamePrompt(false);
    setPendingHoldings(null);
    setPortfolioName('');
  };

  const handleHoldingChange = (setId, holdingId, field, newValue) => {
    console.log('[ReviewUploadView] handleHoldingChange:', { setId, holdingId, field, newValue });

    // Update the specific holdings set
    const updatedSets = holdingsSets.map((set) => {
      if (set.id !== setId) return set;

      // Update the specific holding in this set
      const updatedHoldings = set.holdings.map((h) =>
        h.id === holdingId ? { ...h, [field]: newValue } : h
      );

      // Recalculate this set
      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(updatedHoldings);

      return {
        ...set,
        holdings: recalculatedHoldings,
        totalPortfolioValueSgd: total,
      };
    });

    setHoldingsSets(updatedSets);
  };

  const handleNameChange = (setId, newName) => {
    console.log('[ReviewUploadView] handleNameChange:', { setId, newName });

    const updatedSets = holdingsSets.map((set) =>
      set.id === setId ? { ...set, name: newName } : set
    );

    setHoldingsSets(updatedSets);
  };

  const handleDeleteSet = (setId) => {
    console.log('[ReviewUploadView] handleDeleteSet:', setId);

    const updatedSets = holdingsSets.filter((set) => set.id !== setId);
    setHoldingsSets(updatedSets);
  };

  const handleDeleteHolding = (setId, holdingId) => {
    console.log('[ReviewUploadView] handleDeleteHolding:', { setId, holdingId });

    // Find the holdings set and remove the holding from it
    const updatedSets = holdingsSets.map((set) => {
      if (set.id !== setId) return set;

      // Remove the holding from this set
      const updatedHoldings = set.holdings.filter((h) => h.id !== holdingId);

      // Recalculate the portfolio with updated holdings
      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(updatedHoldings);

      return {
        ...set,
        holdings: recalculatedHoldings,
        totalPortfolioValueSgd: total,
      };
    });

    setHoldingsSets(updatedSets);
  };

  const handleSave = () => {
    console.log('[ReviewUploadView] Saving all holdings sets, count:', holdingsSets.length);

    if (holdingsSets.length === 0) {
      setError('Please upload at least one portfolio before saving');
      return;
    }

    onSaveHoldings(holdingsSets, reviewName);
  };

  const handleGenerateReportClick = () => {
    console.log('[ReviewUploadView] Generate Report clicked, opening form');
    setShowReportForm(true);
  };

  const handleReportFormCancel = () => {
    console.log('[ReviewUploadView] Report form cancelled');
    setShowReportForm(false);
  };

  const handleReportGenerated = (reportData) => {
    console.log('[ReviewUploadView] Report generated with data:', reportData);

    try {
      // Open report in new window for preview/printing
      openReportInNewWindow(reportData, holdingsSets);

      // Also trigger download
      setTimeout(() => {
        downloadReport(reportData, holdingsSets);
      }, 500);

      setShowReportForm(false);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('[ReviewUploadView] Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
    }
  };

  // Get all reviews for this client (sorted by creation date descending, latest first)
  const getAllReviewsForClient = () => {
    const clientReviews = reviews.filter(
      (r) => r.clientId === selectedClientId && r.status === 'extracted'
    );
    // Sort by creation date descending (most recent first)
    return clientReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const allReviews = getAllReviewsForClient();

  return (
    <div className="gradient-northern-lights" style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Button (Top Navigation) */}
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FFA366',
              color: 'white',
              border: 'none',
              borderRadius: '45px',
              cursor: 'pointer',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '400',
              transition: 'background-color 0.2s ease',
              boxShadow: 'none',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#FF8F44';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'none';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FFA366';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'none';
            }}
          >
            ← Back
          </button>
        </div>

        {/* Main Content Area: Sidebar + Content */}
        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Left Sidebar - Only show when viewing past reviews */}
          {isPastReview && (
            <div
              style={{
                width: '220px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 20px 0',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Reviews
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* All reviews in order (latest first), with current one bolded */}
                  {allReviews.map((reviewItem) => (
                    <button
                      key={reviewItem.id}
                      onClick={() => {
                        console.log('[ReviewUploadView] Switching to review:', reviewItem.id);
                        onSelectReview(reviewItem.id);
                      }}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: review.id === reviewItem.id ? 'rgba(255, 163, 102, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: review.id === reviewItem.id ? '#FF8F44' : '#1a1a1a',
                        border: review.id === reviewItem.id ? '1px solid rgba(255, 163, 102, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: review.id === reviewItem.id ? '700' : '500',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Poppins', sans-serif",
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        boxShadow: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (review.id !== reviewItem.id) {
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (review.id !== reviewItem.id) {
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {reviewItem.reviewName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right Content Area */}
          <div style={{ flex: 1 }}>
            {/* Review Name - Show only for past reviews or after naming new reviews */}
            {!showReviewNamePrompt && (
              <>
                {!isEditingReviewName ? (
                  <h2
                    onClick={() => setIsEditingReviewName(true)}
                    style={{
                      margin: '0 0 30px 0',
                      padding: '0',
                      fontSize: '32px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      letterSpacing: '-0.5px',
                      fontFamily: "'Albra', sans-serif",
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease',
                      lineHeight: '1.2',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => (e.target.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.target.style.opacity = '1')}
                  >
                    {reviewName}
                  </h2>
                ) : (
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        console.log('[ReviewUploadView] Saving review name on Enter:', reviewName);
                        onUpdateReviewName(reviewName);
                        setIsEditingReviewName(false);
                      }
                    }}
                    onBlur={(e) => {
                      console.log('[ReviewUploadView] Saving review name on blur:', reviewName);
                      onUpdateReviewName(reviewName);
                      setIsEditingReviewName(false);
                    }}
                    autoFocus
                    placeholder="Review Name e.g. Q1 2026"
                    style={{
                      display: 'block',
                      marginBottom: '30px',
                      padding: '8px 18px',
                      fontSize: '32px',
                      fontWeight: '600',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      color: '#1a1a1a',
                      outline: 'none',
                      fontFamily: "'Albra', sans-serif",
                      letterSpacing: '-0.5px',
                      borderRadius: '45px',
                      width: 'auto',
                      minWidth: '300px',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                      lineHeight: '1.2',
                      height: '44px',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 1)';
                    }}
                  />
                )}
              </>
            )}

            {/* Review Name Prompt - Only show for new reviews without a name */}
            {showReviewNamePrompt && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px',
                  marginTop: '60px',
                  animation: 'slideInUp 0.6s ease-out',
                }}
              >
                <p
                  style={{
                    fontSize: '16px',
                    color: '#1a1a1a',
                    marginBottom: '24px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    fontWeight: '400',
                    lineHeight: '1.6',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  What would you like to name this review?
                </p>

                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="e.g., Q1 2026, Portfolio Review"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && reviewName.trim()) {
                      console.log('[ReviewUploadView] Setting review name:', reviewName);
                      onUpdateReviewName(reviewName);
                      setShowReviewNamePrompt(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 18px',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '45px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#1a1a1a',
                    fontFamily: "'Poppins', sans-serif",
                    marginBottom: '20px',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                  }}
                />

                <button
                  onClick={() => {
                    if (reviewName.trim()) {
                      console.log('[ReviewUploadView] Setting review name:', reviewName);
                      onUpdateReviewName(reviewName);
                      setShowReviewNamePrompt(false);
                    }
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#FFA366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '45px',
                    cursor: reviewName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '400',
                    transition: 'background-color 0.2s ease',
                    fontFamily: "'Poppins', sans-serif",
                    opacity: reviewName.trim() ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (reviewName.trim()) {
                      e.target.style.backgroundColor = '#FF8F44';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (reviewName.trim()) {
                      e.target.style.backgroundColor = '#FFA366';
                    }
                  }}
                >
                  Continue
                </button>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            {/* Upload Area - Show for all reviews */}
            <UploadArea onUpload={handleUpload} isLoading={isLoading} shouldFlash={shouldFlashUpload} />

            {/* Success Celebration State */}
            {showSuccessState && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px',
                  marginTop: '60px',
                }}
              >
                {/* Checkmark Icon */}
                <div
                  style={{
                    fontSize: '92px',
                    marginBottom: '8px',
                    animation: 'checkmarkGrow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    color: '#FFA366',
                  }}
                >
                  ✓
                </div>

                {/* Success Message */}
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#FFA366',
                    marginBottom: '40px',
                    textAlign: 'center',
                    fontFamily: "'Poppins', sans-serif",
                    animation: 'fadeInUp 0.8s ease-out 0.3s both',
                  }}
                >
                  Portfolio uploaded successfully!
                </h2>
              </div>
            )}

            {/* Error State - No File Detected */}
            {showErrorState && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px',
                  marginTop: '60px',
                }}
              >
                {/* X Icon */}
                <div
                  style={{
                    fontSize: '92px',
                    marginBottom: '8px',
                    animation: 'errorXGrow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    color: '#dc3545',
                    boxShadow: 'none',
                  }}
                >
                  ✕
                </div>

                {/* Error Message */}
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#dc3545',
                    marginBottom: '40px',
                    textAlign: 'center',
                    fontFamily: "'Poppins', sans-serif",
                    animation: 'fadeInUp 0.8s ease-out 0.3s both',
                    lineHeight: '1.4',
                  }}
                >
                  No file detected<br />please upload again
                </h2>
              </div>
            )}

            {/* Name Prompt for New Portfolio */}
            {showNamePrompt && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px',
                  marginTop: '40px',
                  animation: 'slideInUp 0.6s ease-out',
                }}
              >
                {/* Progress Counter */}
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: '400',
                  }}
                >
                  Portfolio {holdingsSets.length + 1}
                </p>

                {/* Message */}
                <p
                  style={{
                    fontSize: '16px',
                    color: '#1a1a1a',
                    marginBottom: '24px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    fontWeight: '400',
                    lineHeight: '1.6',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  What would you like to name this portfolio?
                </p>

                {/* Text Input Field */}
                <input
                  type="text"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="e.g., HSBC Wealth Accelerate, FAME Advisory, TMGA"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPortfolio();
                  }}
                  onFocus={(e) => {
                    e.target.placeholder = '';
                    e.target.style.animation = 'none';
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      e.target.placeholder = 'e.g., HSBC Wealth Accelerate, FAME Advisory, TMGA';
                      e.target.style.animation = 'inputPulse 2s ease-in-out infinite';
                    }
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '14px 24px',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '45px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#1a1a1a',
                    fontFamily: "'Poppins', sans-serif",
                    marginBottom: '20px',
                    transition: 'all 0.2s ease',
                    animation: 'inputPulse 2s ease-in-out infinite',
                  }}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={handleAddPortfolio}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#FFA366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '45px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '400',
                      transition: 'background-color 0.2s ease',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#FF8F44'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#FFA366'}
                  >
                    Add Portfolio
                  </button>
                  <button
                    onClick={() => {
                      setShowNamePrompt(false);
                      setPendingHoldings(null);
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: 'rgba(192, 57, 43, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '45px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '400',
                      transition: 'background-color 0.2s ease',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(192, 57, 43, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(192, 57, 43, 0.2)';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Multiple Holdings Sets */}
            {holdingsSets.length > 0 && !showNamePrompt && (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: 'rgba(255, 163, 102, 0.15)',
                    color: '#444',
                    borderRadius: '8px',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  ✓ {holdingsSets.length} portfolio(ies) added. Edit any field below. Changes calculate automatically.
                </div>

                <MultipleHoldingsSets
                  holdingsSets={holdingsSets}
                  onNameChange={handleNameChange}
                  onHoldingChange={handleHoldingChange}
                  onDeleteSet={handleDeleteSet}
                  onHoldingDelete={handleDeleteHolding}
                />
              </div>
            )}

            {/* Action Buttons */}
            {holdingsSets.length > 0 && !showNamePrompt && (
              <>
                <style>{`
                  @keyframes sparkle-float {
                    0%, 100% { transform: translateY(0px); opacity: 1; }
                    50% { transform: translateY(-3px); }
                  }
                  .sparkle-icon {
                    display: inline-block;
                    animation: sparkle-float 2s ease-in-out infinite;
                    margin-right: 6px;
                  }
                `}</style>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      setShowNamePrompt(true);
                      // Scroll to top smoothly
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      // Trigger flash after scroll completes
                      setTimeout(() => {
                        setShouldFlashUpload(true);
                        // Reset flash state after animation completes
                        setTimeout(() => {
                          setShouldFlashUpload(false);
                        }, 700);
                      }, 500);
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#8a9aaa',
                      color: 'white',
                      border: 'none',
                      borderRadius: '45px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '400',
                      transition: 'background-color 0.2s ease',
                      fontFamily: "'Poppins', sans-serif",
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#7a8a9a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#8a9aaa'}
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#FFA366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '45px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '400',
                      transition: 'background-color 0.2s ease',
                      fontFamily: "'Poppins', sans-serif",
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#FF8F44'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#FFA366'}
                  >
                    Save All Portfolios
                  </button>
                  <button
                    onClick={handleGenerateReportClick}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '45px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '400',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                      fontFamily: "'Poppins', sans-serif",
                      boxShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#8e44ad';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#9b59b6';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <span className="sparkle-icon">✨</span>
                    Generate Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Report Details Form Modal */}
        {showReportForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
              overflow: 'auto',
            }}
            onClick={(e) => {
              // Close modal if clicking on backdrop
              if (e.target === e.currentTarget) {
                handleReportFormCancel();
              }
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              <ReportDetailsForm
                clientName={clientName}
                holdingsSets={holdingsSets}
                onGenerateReport={handleReportGenerated}
                onCancel={handleReportFormCancel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
