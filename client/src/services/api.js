/**
 * Resolves the API base URL:
 * 1. If VITE_API_URL is set (e.g. in client/.env), use it.
 * 2. If accessed from a secondary device via LAN IP/hostname, connect directly to port 5000: http://<LAN-IP>:5000/api
 * 3. Default to '/api' for localhost development (served via Vite proxy).
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:5000/api`;
    }
  }
  return '/api';
};

/**
 * Universal API fetch wrapper with centralized error handling
 */
async function apiRequest(endpoint, options = {}) {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // System Health & Integrations
  getHealth: () => apiRequest('/health'),

  // Movies
  getMovies: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/movies${query ? `?${query}` : ''}`);
  },
  getFeaturedMovies: () => apiRequest('/movies/featured'),
  getMovieById: (movieId) => apiRequest(`/movies/${movieId}`),
  getMovieCanon: (movieId) => apiRequest(`/movies/${movieId}/canon`),
  resolveMovie: (body) => apiRequest('/movies/resolve', { method: 'POST', body }),

  // RAG & Generation
  retrieveChunks: (body) => apiRequest('/rag/retrieve', { method: 'POST', body }),
  generateBranches: (body) => apiRequest('/rag/generate-branches', { method: 'POST', body }),
  generateExactStory: (body) => apiRequest('/rag/exact-story', { method: 'POST', body }),
  continueTimeline: (body) => apiRequest('/rag/continue-timeline', { method: 'POST', body }),

  // Saved Timelines
  getSavedTimelines: (guestId) => apiRequest(`/timelines?guestId=${encodeURIComponent(guestId)}`),
  getTimelineById: (timelineId) => apiRequest(`/timelines/${timelineId}`),
  saveTimeline: (body) => apiRequest('/timelines', { method: 'POST', body }),
  updateTimeline: (timelineId, body) => apiRequest(`/timelines/${timelineId}`, { method: 'PUT', body }),
  appendTurnToTimeline: (timelineId, turn) => apiRequest(`/timelines/${timelineId}/turn`, { method: 'POST', body: { turn } }),
  deleteTimeline: (timelineId) => apiRequest(`/timelines/${timelineId}`, { method: 'DELETE' }),

  // Admin Diagnostics
  getAdminStatus: (adminKey) => apiRequest('/admin/status', { headers: { 'x-admin-key': adminKey } }),
  getAdminJobs: (adminKey) => apiRequest('/admin/jobs', { headers: { 'x-admin-key': adminKey } }),
  getAdminChunks: (movieId, adminKey) => apiRequest(`/admin/chunks/${movieId}`, { headers: { 'x-admin-key': adminKey } }),
  testRetrieval: (body, adminKey) => apiRequest('/admin/test-retrieval', { method: 'POST', body, headers: { 'x-admin-key': adminKey } }),
  reseedMovies: (adminKey) => apiRequest('/admin/reseed', { method: 'POST', headers: { 'x-admin-key': adminKey } }),
};
