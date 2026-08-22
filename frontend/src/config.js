// BlogHub Central API & WebSocket Environment Configuration
const PROD_BACKEND_URL = 'https://bloghub-api-r9u4.onrender.com';
const DEV_BACKEND_URL = 'http://localhost:5000';

const isProd = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || (isProd ? PROD_BACKEND_URL : DEV_BACKEND_URL)
).replace(/\/+$/, '');

export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL
).replace(/\/+$/, '');

