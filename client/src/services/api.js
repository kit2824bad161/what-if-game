/**
 * WHAT IF — The Alternate Movie Universe
 * Centralized API Service Configuration
 * 
 * Resolves API Base URL:
 * 1. If VITE_API_URL is configured (e.g. in Vercel or client/.env), normalizes it to guarantee
 *    a clean base ending in '/api' without double '/api/api' prefixes.
 * 2. If running on a local private LAN IP (e.g. 192.168.x.x or 10.x.x.x), connects to port 5000: http://<LAN-IP>:5000/api
 * 3. Default to '/api' for localhost development (served via Vite proxy) or same-origin deployments.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

    // Support local LAN device testing (e.g. testing from mobile or another laptop on same Wi-Fi)
    const isLanIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
    if (isLanIp) {
      return `${protocol}//${hostname}:5000/api`;
    }

    // In production without explicit VITE_API_URL, default to same-domain '/api'
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }

  return '/api';
};

/**
 * Universal API fetch wrapper with centralized error handling and safe JSON parsing
 */
async function apiRequest(endpoint, options = {}) {
  const apiBase = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${apiBase}${cleanEndpoint}`;

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

    // Safely parse JSON or handle plain text / HTML error responses gracefully
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || `HTTP ${response.status} ${response.statusText}` };
    }

    if (!response.ok) {
      const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
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
