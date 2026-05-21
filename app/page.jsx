'use client';

import { useEffect, useState } from 'react';
import ClientList from '../components/ClientList';
import ReviewUploadView from '../components/ReviewUploadView';
import { getInitialClients, getInitialReviews } from '../lib/mockData';
import { saveClients, loadClients, saveReviews, loadReviews } from '../lib/storage';

// Simple UUID generator (since we can't import uuid package easily)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    // Load reviews - only use saved reviews if clients are not mock
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

    // Remove client
    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);

    // Remove all reviews for this client
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

    // Update client's reviews array
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

    // Remove review
    const updatedReviews = reviews.filter((r) => r.id !== reviewId);
    setReviews(updatedReviews);

    // Update client's reviews array
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

    // Update the review with holdingsSets and status
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

    // Navigate back
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

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
      }}
    >
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
          AI Report Generator
        </h1>
        <p style={{ margin: '0', color: '#666' }}>
          Portfolio Review Management for Financial Advisors
        </p>
      </header>

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

      <footer style={{ marginTop: '60px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
        <p>Phase 1: Client & Review Management</p>
        <p>
          Open browser console (F12) to see debug logs for troubleshooting data flow
        </p>
      </footer>
    </div>
  );
}
