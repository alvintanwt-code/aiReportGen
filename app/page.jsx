'use client';

import { useEffect, useState } from 'react';
import ProgressiveOnboarding from '../components/ProgressiveOnboarding';
import ReviewPortfolioView from '../components/ReviewPortfolioView';
import { getInitialClients, getInitialReviews } from '../lib/mockData';
import { saveClients, loadClients, saveReviews, loadReviews } from '../lib/storage';
import {
  extractPortfolioFromImage,
  extractPortfolioFromCSV,
} from '../lib/extractionService';
import { recalculatePortfolio } from '../lib/portfolioCalculations';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function Home() {
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [newReviewClient, setNewReviewClient] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedClients = loadClients();
    const savedReviews = loadReviews();

    let clientsToUse = [];
    let reviewsToUse = [];

    if (savedClients && savedClients.length > 0) {
      clientsToUse = savedClients;
    } else {
      clientsToUse = getInitialClients();
      saveClients(clientsToUse);
    }

    const isUsingMockClients =
      clientsToUse === getInitialClients() ||
      (clientsToUse.length > 0 && clientsToUse[0].id === 'client-1');

    if (savedReviews && savedReviews.length > 0) {
      reviewsToUse = savedReviews;
    } else if (isUsingMockClients) {
      reviewsToUse = getInitialReviews();
      saveReviews(reviewsToUse);
    } else {
      reviewsToUse = [];
    }

    setClients(clientsToUse);
    setReviews(reviewsToUse);
    setIsHydrated(true);
  }, []);

  // Save clients to localStorage
  useEffect(() => {
    if (isHydrated) {
      saveClients(clients);
    }
  }, [clients, isHydrated]);

  // Save reviews to localStorage
  useEffect(() => {
    if (isHydrated) {
      saveReviews(reviews);
    }
  }, [reviews, isHydrated]);

  const handleStartNewReview = () => {
    setCurrentView('onboarding');
    setNewReviewClient(null);
  };

  const handleReviewCreated = async (clientName, uploadedFiles) => {
    // Create or get client
    let client = clients.find((c) => c.name === clientName);
    if (!client) {
      client = {
        id: generateId(),
        name: clientName,
        dob: '',
        email: '',
        mobileNumber: '',
        createdAt: new Date().toISOString(),
        reviews: [],
      };
      setClients([...clients, client]);
    }

    // Process uploaded files and extract holdings
    const holdingsSets = [];
    for (const file of uploadedFiles) {
      try {
        const isImage = file.type.startsWith('image/');
        const isCsv =
          file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

        let extractedHoldings = [];
        if (isImage) {
          extractedHoldings = await extractPortfolioFromImage(file);
        } else if (isCsv) {
          extractedHoldings = await extractPortfolioFromCSV(file);
        }

        if (extractedHoldings && extractedHoldings.length > 0) {
          const { holdings: recalculatedHoldings, totalPortfolioValueSgd: total } =
            recalculatePortfolio(extractedHoldings);

          holdingsSets.push({
            id: generateId(),
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            holdings: recalculatedHoldings,
            totalPortfolioValueSgd: total,
          });
        }
      } catch (err) {
        console.error('Error extracting from file:', err);
      }
    }

    if (holdingsSets.length > 0) {
      // Create new review
      const newReview = {
        id: generateId(),
        clientId: client.id,
        reviewName: `Review - ${client.name}`,
        createdAt: new Date().toISOString(),
        status: 'in_progress',
        holdingsSets,
      };

      setReviews([...reviews, newReview]);

      // Update client's reviews
      const updatedClients = clients.map((c) =>
        c.id === client.id
          ? { ...c, reviews: [...c.reviews, newReview.id] }
          : c
      );
      setClients(updatedClients);

      // Navigate to portfolio review
      setSelectedReviewId(newReview.id);
      setCurrentView('review');
    }
  };

  const handleSaveReview = (holdingsSets) => {
    const updatedReviews = reviews.map((r) =>
      r.id === selectedReviewId
        ? {
            ...r,
            holdingsSets,
            status: 'completed',
          }
        : r
    );

    setReviews(updatedReviews);
    setCurrentView('dashboard');
    setSelectedReviewId(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedReviewId(null);
    setNewReviewClient(null);
  };

  if (!isHydrated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const selectedReview = reviews.find((r) => r.id === selectedReviewId);
  const selectedClient = clients.find((c) => c.id === selectedReview?.clientId);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #e5e5e5',
          padding: '24px 0',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <h1
            style={{
              margin: '0',
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
            }}
          >
            leet portfolio extractor
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#999' }}>
            AI-powered portfolio intelligence platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
        {currentView === 'dashboard' && (
          <DashboardView
            reviews={reviews}
            clients={clients}
            onStartNewReview={handleStartNewReview}
          />
        )}

        {currentView === 'onboarding' && (
          <ProgressiveOnboarding
            onReviewCreated={handleReviewCreated}
            onCancel={handleBackToDashboard}
          />
        )}

        {currentView === 'review' && selectedReview && selectedClient && (
          <ReviewPortfolioView
            clientName={selectedClient.name}
            holdingsSets={selectedReview.holdingsSets}
            onSaveHoldings={handleSaveReview}
            onBack={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
}

function DashboardView({ reviews, clients, onStartNewReview }) {
  const recentReviews = reviews
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const getClientName = (clientId) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown';
  };

  const getTotalPortfolioValue = (review) => {
    return review.holdingsSets?.reduce(
      (sum, set) => sum + set.totalPortfolioValueSgd,
      0
    ) || 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <div>
      {/* CTA Section */}
      <div
        style={{
          marginBottom: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ marginBottom: '8px' }}>Client Workspace</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>
            Manage and review client portfolios
          </p>
        </div>
        <button
          onClick={onStartNewReview}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#333')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#1a1a1a')}
        >
          + Start New Portfolio Review
        </button>
      </div>

      {/* Recent Reviews */}
      {recentReviews.length > 0 ? (
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Recent Reviews
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {recentReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 8px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
              >
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {getClientName(review.clientId)}
                </h4>
                <p style={{ margin: '0 0 16px 0', color: '#999', fontSize: '13px' }}>
                  {formatDate(review.createdAt)}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gap: '12px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e5e5e5',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '11px',
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}
                    >
                      Portfolio Value
                    </p>
                    <p
                      style={{
                        margin: '0',
                        fontSize: '18px',
                        fontWeight: '700',
                      }}
                    >
                      {formatCurrency(getTotalPortfolioValue(review))}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '13px',
                      color: '#999',
                    }}
                  >
                    <span>
                      📊 {review.holdingsSets?.length || 0} sources
                    </span>
                    <span>
                      ✨ {review.holdingsSets?.reduce((sum, s) => sum + s.holdings.length, 0) || 0} holdings
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Navigate to review
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#f0f0f0',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  Review Portfolio
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '64px 32px',
            backgroundColor: '#f8f8f8',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #e5e5e5',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Start Your First Portfolio Review
          </h3>
          <p
            style={{
              color: '#999',
              fontSize: '14px',
              marginBottom: '24px',
              maxWidth: '400px',
              margin: '0 auto 24px',
            }}
          >
            Upload portfolio screenshots or statements. AI will intelligently extract and organize the data for you.
          </p>
          <button
            onClick={onStartNewReview}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Upload Files
          </button>
        </div>
      )}
    </div>
  );
}
