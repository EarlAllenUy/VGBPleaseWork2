// API Service - All backend communication
const API_URL = 'http://localhost:3000/api';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return {};
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// GAME API
export const gameAPI = {
  getAll: () => fetch(`${API_URL}/games`).then(r => r.json()),
  
  getById: (gameId) => fetch(`${API_URL}/games/${gameId}`).then(r => r.json()),
  
  search: (title) => fetch(`${API_URL}/games/search?title=${encodeURIComponent(title)}`).then(r => r.json()),
  
  filter: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/games/filter?${queryString}`).then(r => r.json());
  },
  
  create: (gameData) => authFetch(`${API_URL}/games`, {
    method: 'POST',
    body: JSON.stringify(gameData)
  }),
  
  update: (gameId, gameData) => authFetch(`${API_URL}/games/${gameId}`, {
    method: 'PUT',
    body: JSON.stringify(gameData)
  }),
  
  delete: (gameId) => authFetch(`${API_URL}/games/${gameId}`, {
    method: 'DELETE'
  })
};

// REVIEW API
export const reviewAPI = {
  getAll: () => fetch(`${API_URL}/reviews`).then(r => r.json()),
  
  getByGame: (gameId) => fetch(`${API_URL}/reviews/game/${gameId}`).then(r => r.json()),
  
  getByUser: (userId) => authFetch(`${API_URL}/reviews/user/${userId}`),
  
  create: (reviewData) => authFetch(`${API_URL}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }),
  
  update: (reviewId, reviewData) => authFetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData)
  }),
  
  delete: (reviewId, userId, isAdmin) => authFetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId, isAdmin })
  }),
  
  // Admin moderation endpoints
  getAllForAdmin: () => authFetch(`${API_URL}/reviews/admin/all`),
  
  deleteByAdmin: (reviewId) => authFetch(`${API_URL}/reviews/admin/${reviewId}`, {
    method: 'DELETE'
  })
};

// FAVORITE API
export const favoriteAPI = {
  getUserFavorites: (userId) => authFetch(`${API_URL}/favorites/user/${userId}`),
  
  add: (userId, gameId) => authFetch(`${API_URL}/favorites`, {
    method: 'POST',
    body: JSON.stringify({ userId, gameId })
  }),
  
  remove: (userId, gameId) => authFetch(`${API_URL}/favorites/${userId}/${gameId}`, {
    method: 'DELETE'
  }),
  
  check: (userId, gameId) => authFetch(`${API_URL}/favorites/check/${userId}/${gameId}`)
};

// AUTH API
export const authAPI = {
  register: (userData) => fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  }).then(r => r.json()),
  
  getUser: (userId) => authFetch(`${API_URL}/auth/user/${userId}`),
  
  updateUser: (userId, userData) => authFetch(`${API_URL}/auth/user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  verifyAdmin: (userId) => authFetch(`${API_URL}/auth/verify-admin/${userId}`)
};