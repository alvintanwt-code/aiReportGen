'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  X as XIcon,
  ChevronRight,
  Plus,
  Save,
  Sparkles,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import UploadArea from './UploadArea';
import MultipleHoldingsSets from './MultipleHoldingsSets';
import ReportDetailsForm from './ReportDetailsForm';
import { extractPortfolioFromImage, extractPortfolioFromCSV } from '../lib/extractionService';
import { recalculatePortfolio } from '../lib/portfolioCalculations';
import { downloadReport, openReportInNewWindow } from '../lib/reportGenerationService';

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

  useEffect(() => {
    setHoldingsSets(review.holdingsSets || []);
    setReviewName(review.reviewName || '');
    setIsEditingReviewName(false);
  }, [review.id]);

  const isPastReview =
    review.status === 'extracted' && review.holdingsSets && review.holdingsSets.length > 0;

  useEffect(() => {
    if (showSuccessState) {
      const timer = setTimeout(() => {
        setShowSuccessState(false);
        setShowNamePrompt(true);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [showSuccessState]);

  const handleUpload = async (file) => {
    setIsLoading(true);
    setError('');
    try {
      const isImage = file.type.startsWith('image/');
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

      let extractedHoldings;
      if (isImage) {
        extractedHoldings = await extractPortfolioFromImage(file);
      } else if (isCsv) {
        extractedHoldings = await extractPortfolioFromCSV(file);
      } else {
        throw new Error('Unsupported file type');
      }

      const holdingsWithAllocation = extractedHoldings.map((holding) => ({
        ...holding,
        originalAllocationPercent: holding.originalAllocationPercent || null,
      }));

      const { holdings: recalculatedHoldings } = recalculatePortfolio(holdingsWithAllocation);

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
    if (!pendingHoldings) {
      setShowErrorState(true);
      setTimeout(() => setShowErrorState(false), 2500);
      return;
    }
    if (!portfolioName.trim()) {
      setError('Please enter a portfolio name (e.g., HSBC, AIA).');
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
    setError('');
  };

  const handleHoldingChange = (setId, holdingId, field, newValue) => {
    const updatedSets = holdingsSets.map((set) => {
      if (set.id !== setId) return set;
      const updatedHoldings = set.holdings.map((h) =>
        h.id === holdingId ? { ...h, [field]: newValue } : h
      );
      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(updatedHoldings);
      return { ...set, holdings: recalculatedHoldings, totalPortfolioValueSgd: total };
    });
    setHoldingsSets(updatedSets);
  };

  const handleNameChange = (setId, newName) => {
    setHoldingsSets(holdingsSets.map((set) => (set.id === setId ? { ...set, name: newName } : set)));
  };

  const handleDeleteSet = (setId) => {
    setHoldingsSets(holdingsSets.filter((set) => set.id !== setId));
  };

  const handleDeleteHolding = (setId, holdingId) => {
    const updatedSets = holdingsSets.map((set) => {
      if (set.id !== setId) return set;
      const updatedHoldings = set.holdings.filter((h) => h.id !== holdingId);
      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(updatedHoldings);
      return { ...set, holdings: recalculatedHoldings, totalPortfolioValueSgd: total };
    });
    setHoldingsSets(updatedSets);
  };

  const handleSave = () => {
    if (holdingsSets.length === 0) {
      setError('Please upload at least one portfolio before saving.');
      return;
    }
    onSaveHoldings(holdingsSets, reviewName);
  };

  const validateAllocationBeforeReport = () => {
    for (const set of holdingsSets) {
      if (!set.holdings || set.holdings.length === 0) continue;
      const allocations = set.holdings
        .map((h) => h.originalAllocationPercent)
        .filter((a) => a !== null && a !== undefined && a !== '');

      if (allocations.length > 0 && allocations.length < set.holdings.length) {
        setError(
          `${set.name}: Original Allocation is partially filled. Either fill all values to sum to 100%, or leave all blank.`
        );
        return false;
      }
      if (allocations.length === set.holdings.length) {
        const total = allocations.reduce((sum, a) => sum + (parseFloat(a) || 0), 0);
        if (Math.abs(total - 100) > 0.01) {
          setError(
            `${set.name}: Original Allocation must sum to 100% (currently ${total.toFixed(2)}%).`
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleGenerateReportClick = () => {
    if (!validateAllocationBeforeReport()) return;
    setShowReportForm(true);
  };

  const handleReportFormCancel = () => setShowReportForm(false);

  const handleReportGenerated = (reportData) => {
    try {
      openReportInNewWindow(reportData, holdingsSets);
      setTimeout(() => downloadReport(reportData, holdingsSets), 500);
      setShowReportForm(false);
      setError('');
    } catch (err) {
      console.error('[ReviewUploadView] Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
    }
  };

  const getAllReviewsForClient = () => {
    const clientReviews = reviews.filter(
      (r) => r.clientId === selectedClientId && r.status === 'extracted'
    );
    return clientReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const allReviews = getAllReviewsForClient();
  const showRail = isPastReview && allReviews.length > 0;

  const commitReviewName = () => {
    onUpdateReviewName(reviewName);
    setIsEditingReviewName(false);
  };

  const handleReviewNamePromptContinue = () => {
    if (reviewName.trim()) {
      onUpdateReviewName(reviewName);
      setShowReviewNamePrompt(false);
    }
  };

  return (
    <div className="dash-root dash-upload">
      <header className="dash-upload-header">
        <div className="dash-upload-header-left">
          <button className="dash-back" onClick={onBack}>
            <ArrowLeft size={14} strokeWidth={2.2} />
            Back
          </button>
          <div className="dash-crumbs">
            <span className="dash-crumb">{clientName}</span>
            <ChevronRight size={14} className="dash-crumb-sep" />
            <span className="dash-crumb dash-crumb-current">
              {reviewName || 'New review'}
            </span>
          </div>
        </div>
        <div className="dash-topbar-right">
          {holdingsSets.length > 0 && !showNamePrompt && (
            <>
              <button
                className="dash-btn dash-btn-ghost"
                onClick={() => {
                  setShowNamePrompt(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    setShouldFlashUpload(true);
                    setTimeout(() => setShouldFlashUpload(false), 700);
                  }, 500);
                }}
              >
                <Plus size={14} strokeWidth={2.4} />
                Upload another
              </button>
              <button className="dash-btn dash-btn-ghost" onClick={handleSave}>
                <Save size={14} strokeWidth={2.2} />
                Save
              </button>
              <button className="dash-btn dash-btn-generate" onClick={handleGenerateReportClick}>
                <Sparkles size={14} strokeWidth={2.2} />
                Generate report
              </button>
            </>
          )}
        </div>
      </header>

      <div className={`dash-upload-body ${showRail ? '' : 'no-rail'}`}>
        {showRail && (
          <aside className="dash-rail" aria-label="All reviews">
            <div className="dash-rail-title">Reviews</div>
            {allReviews.map((item) => {
              const isActive = review.id === item.id;
              return (
                <button
                  key={item.id}
                  className={`dash-rail-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectReview(item.id)}
                >
                  {isActive && <span className="dash-rail-item-dot" />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.reviewName || 'Untitled review'}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        <main>
          {!showReviewNamePrompt && (
            <div className="dash-title-row">
              {!isEditingReviewName ? (
                <div
                  className="dash-title-edit"
                  onClick={() => setIsEditingReviewName(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsEditingReviewName(true);
                    }
                  }}
                >
                  <span>{reviewName || 'Untitled review'}</span>
                  <Pencil
                    size={14}
                    strokeWidth={2}
                    style={{ marginLeft: 8, color: 'var(--subtle)' }}
                  />
                </div>
              ) : (
                <div
                  className="dash-title-edit"
                  style={{ background: 'var(--slate-100)', borderColor: 'var(--accent-500)', boxShadow: 'var(--ring)' }}
                >
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitReviewName();
                      if (e.key === 'Escape') setIsEditingReviewName(false);
                    }}
                    onBlur={commitReviewName}
                    autoFocus
                    placeholder="e.g., Q1 2026"
                  />
                </div>
              )}
            </div>
          )}

          {!showReviewNamePrompt && (
            <p className="dash-section-sub">
              {isPastReview
                ? 'Edit holdings or generate a report from saved portfolios.'
                : 'Upload portfolio screenshots or CSV statements to extract holdings.'}
            </p>
          )}

          {showReviewNamePrompt && (
            <div className="dash-prompt">
              <span className="dash-prompt-eyebrow">Step 1 of 2</span>
              <h3>What would you like to name this review?</h3>
              <input
                type="text"
                className="dash-input dash-input-lg dash-prompt-input"
                placeholder="e.g., Q1 2026"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && reviewName.trim()) handleReviewNamePromptContinue();
                }}
                autoFocus
              />
              <div className="dash-prompt-actions">
                <button
                  className="dash-btn dash-btn-primary"
                  onClick={handleReviewNamePromptContinue}
                  disabled={!reviewName.trim()}
                  style={!reviewName.trim() ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                >
                  Continue
                  <ChevronRight size={14} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}

          {!showReviewNamePrompt && (
            <UploadArea onUpload={handleUpload} isLoading={isLoading} shouldFlash={shouldFlashUpload} />
          )}

          {showSuccessState && (
            <div className="dash-status">
              <div className="dash-status-icon is-success">
                <Check size={28} strokeWidth={2.6} />
              </div>
              <div className="dash-status-title">Holdings extracted successfully</div>
              <div className="dash-section-sub" style={{ marginBottom: 0 }}>
                Next, give this portfolio a name so you can identify it later.
              </div>
            </div>
          )}

          {showErrorState && (
            <div className="dash-status">
              <div className="dash-status-icon is-error">
                <XIcon size={28} strokeWidth={2.6} />
              </div>
              <div className="dash-status-title">No file detected</div>
              <div className="dash-section-sub" style={{ marginBottom: 0 }}>
                Upload a portfolio screenshot or CSV statement to continue.
              </div>
            </div>
          )}

          {showNamePrompt && (
            <div className="dash-prompt">
              <span className="dash-prompt-eyebrow">Portfolio {holdingsSets.length + 1}</span>
              <h3>What would you like to name this portfolio?</h3>
              <input
                type="text"
                className="dash-input dash-input-lg dash-prompt-input"
                placeholder="e.g., HSBC Wealth Accelerate, FAME Advisory, TMGA"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPortfolio();
                }}
                autoFocus
              />
              {error && (
                <div className="dash-banner dash-banner-danger" role="alert" style={{ width: '100%', maxWidth: 360 }}>
                  <span className="dash-banner-icon">
                    <AlertTriangle size={14} strokeWidth={2.2} />
                  </span>
                  <span>{error}</span>
                </div>
              )}
              <div className="dash-prompt-actions">
                <button
                  className="dash-btn dash-btn-ghost"
                  onClick={() => {
                    setShowNamePrompt(false);
                    setPendingHoldings(null);
                    setPortfolioName('');
                    setError('');
                  }}
                >
                  Cancel
                </button>
                <button className="dash-btn dash-btn-primary" onClick={handleAddPortfolio}>
                  <Plus size={14} strokeWidth={2.4} />
                  Add portfolio
                </button>
              </div>
            </div>
          )}

          {holdingsSets.length > 0 && !showNamePrompt && (
            <>
              <div className="dash-banner dash-banner-info" style={{ marginBottom: 16 }}>
                <span className="dash-banner-icon">
                  <Check size={15} strokeWidth={2.4} />
                </span>
                <span>
                  {holdingsSets.length} portfolio{holdingsSets.length === 1 ? '' : 's'} loaded. Edits below recalculate automatically.
                </span>
              </div>

              <MultipleHoldingsSets
                holdingsSets={holdingsSets}
                onNameChange={handleNameChange}
                onHoldingChange={handleHoldingChange}
                onDeleteSet={handleDeleteSet}
                onHoldingDelete={handleDeleteHolding}
              />

              {error && !showNamePrompt && (
                <div className="dash-banner dash-banner-danger" style={{ marginTop: 16 }} role="alert">
                  <span className="dash-banner-icon">
                    <AlertTriangle size={15} strokeWidth={2.2} />
                  </span>
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showReportForm && (
        <div
          className="dash-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleReportFormCancel();
          }}
        >
          <div className="dash-modal-card">
            <ReportDetailsForm
              reviewId={review.id}
              clientId={selectedClientId}
              clientName={clientName}
              holdingsSets={holdingsSets}
              onGenerateReport={handleReportGenerated}
              onCancel={handleReportFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
