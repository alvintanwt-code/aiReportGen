// localStorage helper functions for persisting data

const CLIENTS_KEY = 'aiReportGen_clients';
const REVIEWS_KEY = 'aiReportGen_reviews';

export const saveClients = (clients) => {
  console.log('[STORAGE] Saving clients:', clients);
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }
};

export const loadClients = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CLIENTS_KEY);
    console.log('[STORAGE] Loaded clients:', stored ? JSON.parse(stored) : 'none');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const saveReviews = (reviews) => {
  console.log('[STORAGE] Saving reviews:', reviews);
  if (typeof window !== 'undefined') {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }
};

export const loadReviews = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(REVIEWS_KEY);
    console.log('[STORAGE] Loaded reviews:', stored ? JSON.parse(stored) : 'none');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const clearAllData = () => {
  console.log('[STORAGE] Clearing all data');
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLIENTS_KEY);
    localStorage.removeItem(REVIEWS_KEY);
  }
};
