/**
 * Enterprise Application Configuration
 *
 * Supports Vercel environment variables:
 * - VITE_API_URL or VITE_BACKEND_URL for HTTP REST API
 * - VITE_WS_URL for real-time WebSocket connection
 *
 * In local development, defaults to http://localhost:3001 and ws://localhost:3001.
 */

const rawBackend = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_BACKEND_URL || 
  'http://localhost:3001'
).trim();

export const BACKEND_URL = rawBackend.replace(/\/$/, '');

export const WS_URL = import.meta.env.VITE_WS_URL 
  ? (import.meta.env.VITE_WS_URL as string).trim()
  : BACKEND_URL.startsWith('https://')
    ? BACKEND_URL.replace('https://', 'wss://')
    : BACKEND_URL.replace('http://', 'ws://');
