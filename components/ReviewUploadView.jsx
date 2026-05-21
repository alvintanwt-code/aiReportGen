'use client';

import { useState } from 'react';
import UploadArea from './UploadArea';
import MultipleHoldingsSets from './MultipleHoldingsSets';
import { extractPortfolioFromImage } from '../lib/extractionService';
import { recalculatePortfolio } from '../lib/portfolioCalculations';

// UUID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ReviewUploadView({
  review,
  onSaveHoldings,
  onBack,
}) {
  const [holdingsSets, setHoldingsSets] = useState(review.holdingsSets || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingHoldings, setPendingHoldings] = useState(null);
  const [portfolioName, setPortfolioName] = useState('');

  console.log('[ReviewUploadView] Rendered for review:', review.id, 'holdingsSets:', holdingsSets.length);

  const handleUpload = async (file) => {
    console.log('[ReviewUploadView] handleUpload called with file:', file.name);

    setIsLoading(true);
    setError('');

    try {
      // Call real extraction service (which calls backend)
      const extractedHoldings = await extractPortfolioFromImage(file);
      console.log('[ReviewUploadView] Got extracted holdings:', extractedHoldings);

      // Recalculate with initial values
      const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
        recalculatePortfolio(extractedHoldings);

      console.log('[ReviewUploadView] Recalculated portfolio, total:', total);

      setPendingHoldings(recalculatedHoldings);
      setPortfolioName('');
      setShowNamePrompt(true);
      setIsLoading(false);
    } catch (err) {
      console.error('[ReviewUploadView] Error during extraction:', err);
      setError('Failed to extract portfolio holdings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAddPortfolio = () => {
    console.log('[ReviewUploadView] Adding portfolio with name:', portfolioName);

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

  const handleSave = () => {
    console.log('[ReviewUploadView] Saving all holdings sets, count:', holdingsSets.length);

    if (holdingsSets.length === 0) {
      setError('Please upload at least one portfolio before saving');
      return;
    }

    onSaveHoldings(holdingsSets);
  };

  return (
    <div style={{ maxWidth: '1400px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Back to Client
        </button>
        <h2 style={{ margin: '0 0 10px 0' }}>{review.reviewName}</h2>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Status: {review.status} • Portfolios: {holdingsSets.length}
        </p>
      </div>

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

      {/* Upload Area */}
      <UploadArea onUpload={handleUpload} isLoading={isLoading} />

      {/* Name Prompt for New Portfolio */}
      {showNamePrompt && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#e8f4f8',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #007bff',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0' }}>Name This Portfolio</h3>
          <p style={{ margin: '0 0 10px 0', color: '#666' }}>
            Enter a name for this portfolio (e.g., HSBC, AIA, Manulife)
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="Portfolio name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPortfolio();
              }}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleAddPortfolio}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Portfolio
            </button>
            <button
              onClick={() => {
                setShowNamePrompt(false);
                setPendingHoldings(null);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
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
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
            }}
          >
            ✓ {holdingsSets.length} portfolio(ies) added. Edit any field below. Changes calculate automatically.
          </div>

          <MultipleHoldingsSets
            holdingsSets={holdingsSets}
            onNameChange={handleNameChange}
            onHoldingChange={handleHoldingChange}
            onDeleteSet={handleDeleteSet}
          />
        </div>
      )}

      {/* Action Buttons */}
      {holdingsSets.length > 0 && !showNamePrompt && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={() => setShowNamePrompt(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Upload Another ({holdingsSets.length})
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Save All Portfolios
          </button>
        </div>
      )}
    </div>
  );
}
