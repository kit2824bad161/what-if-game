import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocketUrl = () => {
  // 1. Explicit Socket URL configured in environment
  if (import.meta.env.VITE_SOCKET_URL && typeof import.meta.env.VITE_SOCKET_URL === 'string') {
    const trimmed = import.meta.env.VITE_SOCKET_URL.trim();
    if (trimmed.length > 0) {
      return trimmed.replace(/\/+$/, '');
    }
  }

  // 2. Derive from VITE_API_URL if socket URL not explicitly set
  if (import.meta.env.VITE_API_URL && typeof import.meta.env.VITE_API_URL === 'string') {
    const trimmedApi = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    if (trimmedApi.length > 0) {
      return trimmedApi.replace(/\/api\/?$/, '');
    }
  }

  // 3. Browser environment fallback
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

    // LAN IP testing (e.g. mobile or local multi-device)
    const isLanIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
    if (isLanIp) {
      return `${protocol}//${hostname}:5000`;
    }

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // Production domain without explicit URL: use current origin
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

export const getSocket = () => {
  if (!socketInstance) {
    const socketUrl = getSocketUrl();
    console.log(`[Socket] Initializing connection to ${socketUrl}`);

    socketInstance = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      autoConnect: true,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log(`[Socket] Connected to server with ID: ${socketInstance.id}`);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected from server: ${reason}`);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn(`[Socket] Connection error: ${err.message}`);
    });
  }

  return socketInstance;
};
