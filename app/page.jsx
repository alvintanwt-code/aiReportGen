'use client';

import { useEffect, useState } from 'react';
import ClientList from '../components/ClientList';
import ReviewUploadView from '../components/ReviewUploadView';
import { getInitialClients, getInitialReviews } from '../lib/mockData';
import { saveClients, loadClients, saveReviews, loadReviews } from '../lib/storage';

// Simple UUID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const STEPS = [
  {
    id: 'clients',
    title: 'Manage Clients',
    description: 'Create and manage client profiles with personal information',
  },
  {
    id: 'upload',
    title: 'Upload Portfolio',
    description: 'Create reviews and upload portfolio screenshots or CSV files',
  },
  {
    id: 'extract',
    title: 'Extract & Refine',
    description: 'Extract holdings data and edit details before finalizing',
  },
];

function StepIndicator({ steps, currentStep }) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = steps.findIndex(s => s.id === currentStep) > index;

          return (
            <div key={step.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Step circle */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isActive || isPast ? '#1a1a1a' : '#e5e5e5',
                  color: isActive || isPast ? 'white' : '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}
              >
                {isPast ? '✓' : index + 1}
              </div>

              {/* Step label */}
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isActive ? '#1a1a1a' : '#666',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {step.title}
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: isPast ? '#1a1a1a' : '#e5e5e5',
                    marginLeft: '12px',
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SideInstruction({ currentStep, steps }) {
  const step = steps.find(s => s.id === currentStep);

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f8f8f8',
        borderLeft: '3px solid #1a1a1a',
        marginBottom: '32px',
      }}
    >
      <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        Current Step
      </div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#1a1a1a' }}>
        {step?.title}
      </h3>
      <p style={{ margin: '0', fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
        {step?.description}
      </p>
    </div>
  );
}

export default function Home() {
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  console.log('[App] Render - currentView:', currentView, 'clientCount:', clients.length);

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('[App] useEffect: Loading data from localStorage');

    const savedClients = loadClients();
    const savedReviews = loadReviews();

    let clientsToUse = [];
    let reviewsToUse = [];

    // Load clients
    if (savedClients && savedClients.length > 0) {
      console.log('[App] Loaded', savedClients.length, 'clients from storage');
      clientsToUse = savedClients;
    } else {
      console.log('[App] No saved clients, using mock data');
      clientsToUse = getInitialClients();
      saveClients(clientsToUse);
    }

    // Load reviews
    const isUsingMockClients = clientsToUse === getInitialClients() ||
                               (clientsToUse.length > 0 && clientsToUse[0].id === 'client-1');

    if (savedReviews && savedReviews.length > 0) {
      console.log('[App] Loaded', savedReviews.length, 'reviews from storage');
      reviewsToUse = savedReviews;
    } else if (isUsingMockClients) {
      console.log('[App] No saved reviews and using mock clients, using mock data');
      reviewsToUse = getInitialReviews();
      saveReviews(reviewsToUse);
    } else {
      console.log('[App] No saved reviews but using real clients, starting with empty');
      reviewsToUse = [];
    }

    setClients(clientsToUse);
    setReviews(reviewsToUse);
    setIsHydrated(true);
  }, []);

  // Save clients to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      console.log('[App] Saving clients to localStorage');
      saveClients(clients);
    }
  }, [clients, isHydrated]);

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      console.log('[App] Saving reviews to localStorage');
      saveReviews(reviews);
    }
  }, [reviews, isHydrated]);

  const handleAddClient = (name, dob, email, mobileNumber) => {
    console.log('[App] handleAddClient:', { name, dob, email, mobileNumber });

    const newClient = {
      id: generateId(),
      name,
      dob,
      email,
      mobileNumber,
      createdAt: new Date().toISOString(),
      reviews: [],
    };

    console.log('[App] Created new client:', newClient);
    setClients([...clients, newClient]);
  };

  const handleDeleteClient = (clientId) => {
    console.log('[App] handleDeleteClient:', clientId);

    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);

    const updatedReviews = reviews.filter((r) => r.clientId !== clientId);
    setReviews(updatedReviews);

    console.log('[App] Deleted client and', reviews.length - updatedReviews.length, 'reviews');
  };

  const handleAddReview = (clientId, reviewName, reviewId) => {
    console.log('[App] handleAddReview:', { clientId, reviewName, reviewId });

    const newReview = {
      id: reviewId || generateId(),
      clientId,
      reviewName,
      createdAt: new Date().toISOString(),
      status: 'not_started',
      holdings: [],
    };

    console.log('[App] Created new review:', newReview);
    setReviews([...reviews, newReview]);

    const updatedClients = clients.map((c) =>
      c.id === clientId
        ? { ...c, reviews: [...c.reviews, newReview.id] }
        : c
    );
    setClients(updatedClients);
  };

  const handleDeleteReview = (reviewId) => {
    console.log('[App] handleDeleteReview:', reviewId);

    const reviewToDelete = reviews.find((r) => r.id === reviewId);
    const clientId = reviewToDelete.clientId;

    const updatedReviews = reviews.filter((r) => r.id !== reviewId);
    setReviews(updatedReviews);

    const updatedClients = clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            reviews: c.reviews.filter((rid) => rid !== reviewId),
          }
        : c
    );
    setClients(updatedClients);

    console.log('[App] Deleted review');
  };

  const handleStartReview = (reviewId) => {
    console.log('[App] handleStartReview:', reviewId);

    setSelectedReviewId(reviewId);
    setCurrentView('upload');
  };

  const handleBackToDashboard = () => {
    console.log('[App] handleBackToDashboard');

    setCurrentView('dashboard');
    setSelectedReviewId(null);
  };

  const handleSaveHoldings = (holdingsSets) => {
    console.log('[App] handleSaveHoldings:', holdingsSets.length, 'holdings sets');

    const updatedReviews = reviews.map((r) =>
      r.id === selectedReviewId
        ? {
            ...r,
            holdingsSets,
            status: 'extracted',
          }
        : r
    );

    setReviews(updatedReviews);
    console.log('[App] Review status updated to "extracted" with', holdingsSets.length, 'portfolio(ies)');

    setCurrentView('dashboard');
    setSelectedReviewId(null);
  };

  if (!isHydrated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const currentStep = currentView === 'dashboard' ? 'clients' : 'upload';

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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            leet portfolio extractor
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#999' }}>
            Extract, edit, and manage portfolio data with ease
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Step Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Side Instruction */}
        <SideInstruction currentStep={currentStep} steps={STEPS} />

        {/* Content */}
        {currentView === 'dashboard' && (
          <main>
            <ClientList
              clients={clients}
              reviews={reviews}
              onAddClient={handleAddClient}
              onAddReview={handleAddReview}
              onDeleteClient={handleDeleteClient}
              onDeleteReview={handleDeleteReview}
              onStartReview={handleStartReview}
            />
          </main>
        )}

        {currentView === 'upload' && selectedReviewId && (
          <main>
            {(() => {
              const selectedReview = reviews.find((r) => r.id === selectedReviewId);
              if (!selectedReview) {
                return <p>Review not found</p>;
              }
              return (
                <ReviewUploadView
                  review={selectedReview}
                  onSaveHoldings={handleSaveHoldings}
                  onBack={handleBackToDashboard}
                />
              );
            })()}
          </main>
        )}
      </div>
    </div>
  );
}
