/**
 * Enterprise Application Configuration
 *
 * Supports Vercel environment variables:
 * - VITE_API_URL or VITE_BACKEND_URL for HTTP REST API
 * - VITE_WS_URL for real-time WebSocket connection
 *
 * In local development, defaults to http://localhost:3001 and ws://localhost:3001.
 * In production on HTTPS (e.g. Vercel), if the backend is an insecure http:// endpoint,
 * requests are routed via the relative path '' so Vercel's reverse proxy in vercel.json
 * can forward them to the Oracle server without being blocked by browser Mixed Content rules.
 */

const rawBackend = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_BACKEND_URL || 
  'http://localhost:3001'
).trim().replace(/\/$/, '');

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const isRawHttpBackend = rawBackend.startsWith('http://') && !rawBackend.includes('localhost');

// If frontend is on HTTPS and backend is on HTTP IP, route through Vercel's /api proxy
export const BACKEND_URL = (isHttps && isRawHttpBackend) ? '' : rawBackend;

export const WS_URL = import.meta.env.VITE_WS_URL 
  ? (import.meta.env.VITE_WS_URL as string).trim()
  : BACKEND_URL.startsWith('https://')
    ? BACKEND_URL.replace('https://', 'wss://')
    : BACKEND_URL.startsWith('http://')
      ? BACKEND_URL.replace('http://', 'ws://')
      : (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}` : 'ws://localhost:3001');
