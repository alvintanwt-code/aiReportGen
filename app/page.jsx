'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reload } from 'firebase/auth';
import ReviewUploadView from '../components/ReviewUploadView';
import LoginPage from '../components/LoginPage';
import { getInitialClients, getInitialReviews } from '../lib/mockData';
import { onAuthChange, logout, saveClients, loadClients, saveReviews, loadReviews, getUserProfile, loadFNASummary } from '../lib/firebaseUtils';
import { auth } from '../lib/firebase';

// Simple UUID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function LandingPage({ clients, reviews, onAddClient, onSelectClient, onDeleteClient, onNewReview, onPastReviews, userName, searchQuery, onSearchChange, savedSummaryClientIds }) {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [displayedText, setDisplayedText] = useState('');

  // Typing animation effect
  useEffect(() => {
    const fullText = `Hello, ${userName}`;
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 63); // ~63ms per character for natural typing pace

    return () => clearInterval(typingInterval);
  }, [userName]);

  const handleCreate = () => {
    if (clientName.trim()) {
      onAddClient(clientName);
      setClientName('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientStats = (client) => {
    // Only count SAVED reviews (status: 'extracted')
    const savedReviews = reviews.filter((r) => r.clientId === client.id && r.status === 'extracted');

    // Calculate total portfolio count from all SAVED reviews
    let totalPortfolios = 0;
    let totalAUM = 0;
    savedReviews.forEach((review) => {
      if (review.holdingsSets) {
        totalPortfolios += review.holdingsSets.length;
        review.holdingsSets.forEach((set) => {
          totalAUM += set.totalPortfolioValueSgd || 0;
        });
      }
    });

    return {
      reviewCount: savedReviews.length,
      portfolioCount: totalPortfolios,
      totalAUM,
    };
  };

  // Format AUM with commas and currency sign
  const formatAUM = (amount) => {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="gradient-northern-lights" style={{ minHeight: '100vh', padding: '60px 24px', display: 'flex', flexDirection: 'column' }}>
      {/* Welcome Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginBottom: '80px' }}>
        <style>{`
          @keyframes typing-cursor {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
          .typing-text {
            display: inline-block;
            position: relative;
          }
          .typing-cursor {
            animation: typing-cursor 0.6s infinite;
            margin-left: 2px;
          }
        `}</style>
        <h1 style={{ fontSize: '58px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a', letterSpacing: '-1px', fontFamily: "'Albra', sans-serif" }}>
          <span className="typing-text">
            {displayedText}
            {displayedText.length < `Welcome, ${userName || 'Advisor'}`.length && (
              <span className="typing-cursor">|</span>
            )}
          </span>
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '40px' }}>
          Create and manage client portfolios with intelligence
        </p>

        {/* Input & Create */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="text"
              placeholder="Enter your client's name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                padding: '14px 20px',
                fontSize: '15px',
                border: 'none',
                borderRadius: '50px',
                width: '330px',
                backgroundColor: 'transparent',
                color: '#1a1a1a',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreate}
              style={{
                padding: '12px 18px',
                backgroundColor: '#FFA366',
                color: 'white',
                border: 'none',
                borderRadius: '45px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'background-color 0.2s ease',
                marginLeft: '16px',
                flexShrink: 0,
                boxShadow: 'none',
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
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Removed (now in top-right header) */}

      {/* Client Cards Grid */}
      {clients.length > 0 && (
        <div style={{
          display: filteredClients.length < 4 ? 'flex' : 'block',
          justifyContent: filteredClients.length < 4 ? 'center' : 'initial',
          width: '100%',
          padding: '0 24px',
        }}>
          <div
            className="client-cards-grid"
            style={{
              gridTemplateColumns: filteredClients.length < 4
                ? `repeat(${filteredClients.length}, 320px)`
                : 'repeat(4, 1fr)',
              width: filteredClients.length < 4 ? 'fit-content' : '100%',
            }}
          >
            {filteredClients.map((client) => {
              const stats = getClientStats(client);
              const handleDeleteClick = (e) => {
                e.stopPropagation();
                if (window.confirm(`Delete client "${client.name}" and all their portfolios?`)) {
                  onDeleteClient(client.id);
                }
              };
              return (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  style={{
                    padding: '20px',
                    borderRadius: '22px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  {/* Delete Button */}
                  <button
                    onClick={handleDeleteClick}
                    title="Delete"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0px',
                      padding: '4px',
                      cursor: 'pointer',
                      fontSize: '20px',
                      fontFamily: 'monospace',
                      fontWeight: '100',
                      color: '#d0d0d0',
                      transition: 'color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      lineHeight: '1',
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#666666';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#d0d0d0';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    ×
                  </button>

                  <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
                    {client.name}
                  </h3>
                  <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Reviews Done</p>
                      <p style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                        {stats.reviewCount}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Portfolios</p>
                      <p style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                        {stats.portfolioCount}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Total AUM</p>
                      <p style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                        {formatAUM(stats.totalAUM)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewReview(client.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#FFA366',
                          color: 'white',
                          border: 'none',
                          borderRadius: '22px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#FF8F44'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#FFA366'}
                      >
                        New Review
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPastReviews(client.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#e8e8e8',
                          color: '#1a1a1a',
                          border: 'none',
                          borderRadius: '22px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease',
                          fontFamily: "'Poppins', sans-serif",
                          opacity: stats.reviewCount > 0 ? 1 : 0.5,
                        }}
                        disabled={stats.reviewCount === 0}
                        onMouseEnter={(e) => {
                          if (stats.reviewCount > 0) e.target.style.backgroundColor = '#d0d0d0';
                        }}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e8e8e8'}
                      >
                        Past Reviews
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/fna?clientId=${client.id}`);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: '#FF8F44',
                        color: 'white',
                        border: 'none',
                        borderRadius: '22px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#FF7A1F'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#FF8F44'}
                    >
                      Financial Needs Analysis
                    </button>
                    {savedSummaryClientIds.has(client.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/fna-summary-view?clientId=${client.id}`);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '22px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                      >
                        ✓ View FNA Summary
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {clients.length > 0 && filteredClients.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '16px', color: '#999' }}>
            No clients found matching "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSummaryClientIds, setSavedSummaryClientIds] = useState(new Set());

  console.log('[App] Render - user:', user?.email, 'currentView:', currentView);

  // Check auth state on mount
  useEffect(() => {
    console.log('[App] useEffect: Setting up auth listener');

    const unsubscribe = onAuthChange(async (currentUser) => {
      console.log('[App] Auth state changed:', currentUser?.email);

      if (currentUser) {
        // Reload to ensure displayName is current
        await reload(currentUser);
        console.log('[App] User displayName:', currentUser.displayName);

        // Get user profile from Firestore
        const profile = await getUserProfile(currentUser.uid);
        console.log('[App] User profile:', profile);
        setUserProfile(profile);

        // User is logged in - load their data from Firebase
        console.log('[App] Loading data from Firebase for user:', currentUser.uid);
        const savedClients = await loadClients(currentUser.uid);
        const savedReviews = await loadReviews(currentUser.uid);

        console.log('[App] Loaded', savedClients.length, 'clients and', savedReviews.length, 'reviews');
        setClients(savedClients);
        setReviews(savedReviews);
      } else {
        setUserProfile(null);
      }

      setUser(currentUser);
      setIsLoading(false);
      setIsHydrated(true);
    });

    return unsubscribe;
  }, []);

  // Load FNA summary status for all clients
  useEffect(() => {
    console.log('[App] FNA Check: user=', user?.uid, 'clients=', clients.length);
    if (user && clients.length > 0) {
      console.log('[App] Loading FNA summary status for', clients.length, 'clients');
      const loadSummaryStatus = async () => {
        const summaryIds = new Set();
        for (const client of clients) {
          try {
            const summary = await loadFNASummary(user.uid, client.id);
            if (summary) {
              console.log('[App] Found FNA summary for client:', client.id);
              summaryIds.add(client.id);
            } else {
              console.log('[App] No FNA summary for client:', client.id);
            }
          } catch (error) {
            console.error('[App] Error loading FNA summary for client', client.id, ':', error);
          }
        }
        console.log('[App] Summary check complete, found', summaryIds.size, 'summaries');
        setSavedSummaryClientIds(summaryIds);
      };
      loadSummaryStatus();
    }
  }, [user, clients]);

  // Save clients to Firebase whenever they change
  useEffect(() => {
    if (isHydrated && user) {
      console.log('[App] Saving clients to Firebase');
      saveClients(user.uid, clients);
    }
  }, [clients, isHydrated, user]);

  // Save reviews to Firebase whenever they change
  useEffect(() => {
    if (isHydrated && user) {
      console.log('[App] Saving reviews to Firebase');
      saveReviews(user.uid, reviews);
    }
  }, [reviews, isHydrated, user]);

  const handleAddClient = (name) => {
    console.log('[App] handleAddClient:', { name });

    const newClient = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      reviews: [],
    };

    console.log('[App] Created new client:', newClient);
    setClients([...clients, newClient]);

    // Create a new review and navigate to upload view
    const reviewId = generateId();
    const newReview = {
      id: reviewId,
      clientId: newClient.id,
      reviewName: '',
      createdAt: new Date().toISOString(),
      status: 'not_started',
      holdingsSets: [],
    };

    setReviews([...reviews, newReview]);
    setSelectedClientId(newClient.id);
    setSelectedReviewId(reviewId);
    setCurrentView('upload');
  };

  const handleDeleteClient = (clientId) => {
    console.log('[App] handleDeleteClient:', clientId);

    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);

    const updatedReviews = reviews.filter((r) => r.clientId !== clientId);
    setReviews(updatedReviews);

    console.log('[App] Deleted client and', reviews.length - updatedReviews.length, 'reviews');
  };

  const handleNewReview = (clientId) => {
    console.log('[App] handleNewReview:', clientId);

    const reviewId = generateId();
    const newReview = {
      id: reviewId,
      clientId,
      reviewName: '',
      createdAt: new Date().toISOString(),
      status: 'not_started',
      holdingsSets: [],
    };

    setReviews([...reviews, newReview]);
    setSelectedClientId(clientId);
    setSelectedReviewId(reviewId);
    setCurrentView('upload');
  };

  const handlePastReviews = (clientId) => {
    console.log('[App] handlePastReviews:', clientId);

    // Get the latest (most recent) extracted review for this client
    const clientReviews = reviews.filter((r) => r.clientId === clientId && r.status === 'extracted');
    const latestReview = clientReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (latestReview) {
      setSelectedClientId(clientId);
      setSelectedReviewId(latestReview.id);
      setCurrentView('upload');
    }
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
    setSelectedClientId(null);
  };

  const handleLogout = async () => {
    console.log('[App] handleLogout');
    try {
      await logout();
      setUser(null);
      setClients([]);
      setReviews([]);
      setCurrentView('dashboard');
    } catch (err) {
      console.error('[App] Logout error:', err);
    }
  };

  const handleSelectClient = (clientId) => {
    console.log('[App] handleSelectClient:', clientId);

    setSelectedClientId(clientId);

    // Check if there's an existing saved review for this client
    const existingReview = reviews.find((r) => r.clientId === clientId && r.status === 'extracted');

    if (existingReview) {
      console.log('[App] Loading existing review:', existingReview.id);
      setSelectedReviewId(existingReview.id);
    } else {
      // Create a new review for this client
      const reviewId = generateId();
      handleAddReview(clientId, '', reviewId);
      setSelectedReviewId(reviewId);
    }

    setCurrentView('upload');
  };

  const handleSaveHoldings = (holdingsSets, reviewName) => {
    console.log('[App] handleSaveHoldings:', holdingsSets.length, 'holdings sets, review name:', reviewName);

    const updatedReviews = reviews.map((r) =>
      r.id === selectedReviewId
        ? {
            ...r,
            holdingsSets,
            reviewName,
            status: 'extracted',
          }
        : r
    );

    setReviews(updatedReviews);
    console.log('[App] Review status updated to "extracted" with', holdingsSets.length, 'portfolio(ies)');

    setCurrentView('dashboard');
    setSelectedReviewId(null);
  };

  const handleUpdateReviewName = (reviewName) => {
    console.log('[App] handleUpdateReviewName:', reviewName);

    const updatedReviews = reviews.map((r) =>
      r.id === selectedReviewId
        ? {
            ...r,
            reviewName,
          }
        : r
    );

    setReviews(updatedReviews);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '16px', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <LoginPage
        onAuthSuccess={() => {
          console.log('[App] Auth successful, user logged in');
        }}
      />
    );
  }

  return (
    <>
      {currentView === 'dashboard' && (
        <div>
          <LandingPage
            clients={clients}
            reviews={reviews}
            onAddClient={handleAddClient}
            onSelectClient={handleSelectClient}
            onDeleteClient={handleDeleteClient}
            onNewReview={handleNewReview}
            onPastReviews={handlePastReviews}
            userName={userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Advisor'}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            savedSummaryClientIds={savedSummaryClientIds}
          />
          {/* Search Bar & Logout Button */}
          <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 1000 }}>
            {/* Search Bar */}
            {clients.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '50px',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  transition: 'all 0.2s ease',
                  width: '280px',
                }}
              >
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0 8px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '45px',
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#1a1a1a',
                    outline: 'none',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                />
                <span style={{ padding: '0 8px', color: '#999', fontSize: '16px' }}>🔍</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FFA366',
                color: 'white',
                border: 'none',
                borderRadius: '45px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'background-color 0.2s ease',
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#FF8F44')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFA366')}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {currentView === 'upload' && selectedReviewId && (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
          {(() => {
            const selectedReview = reviews.find((r) => r.id === selectedReviewId);
            if (!selectedReview) {
              return <p>Review not found</p>;
            }
            const selectedClient = clients.find((c) => c.id === selectedClientId);
            return (
              <ReviewUploadView
                review={selectedReview}
                clientName={selectedClient?.name || 'Client'}
                onSaveHoldings={handleSaveHoldings}
                onUpdateReviewName={handleUpdateReviewName}
                onBack={handleBackToDashboard}
                reviews={reviews}
                selectedClientId={selectedClientId}
                onSelectReview={(reviewId) => {
                  setSelectedReviewId(reviewId);
                }}
              />
            );
          })()}
        </div>
      )}
    </>
  );
}
