import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    // Connect to the same host machine on backend port 5000
    // (works for both LAN IP like 10.x.x.x / 192.168.x.x and localhost)
    return `${protocol}//${hostname}:5000`;
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
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
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
