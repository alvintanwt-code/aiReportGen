// Mock initial data for development
export const getInitialClients = () => [
  {
    id: 'client-1',
    name: 'John Tan',
    dob: '1985-03-15',
    email: 'john.tan@example.com',
    mobileNumber: '+65 9123 4567',
    createdAt: new Date().toISOString(),
    reviews: ['review-1', 'review-2'],
  },
  {
    id: 'client-2',
    name: 'Sarah Johnson',
    dob: '1990-07-22',
    email: 'sarah.j@example.com',
    mobileNumber: '+65 8765 4321',
    createdAt: new Date().toISOString(),
    reviews: [],
  },
];

export const getInitialReviews = () => [
  {
    id: 'review-1',
    clientId: 'client-1',
    reviewName: 'Q2 2026 Portfolio Review',
    createdAt: new Date().toISOString(),
    status: 'not_started',
    holdingsSets: [],
  },
  {
    id: 'review-2',
    clientId: 'client-1',
    reviewName: 'H1 2026 Review',
    createdAt: new Date().toISOString(),
    status: 'not_started',
    holdingsSets: [],
  },
];
