/**
 * Enterprise Application Configuration
 *
 * In local development, defaults to localhost:3001.
 * In production (e.g. Vercel deployment talking to Oracle Cloud backend),
 * configure VITE_BACKEND_URL in Vercel project environment variables.
 */

const rawBackend = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').trim();
export const BACKEND_URL = rawBackend.replace(/\/$/, '');

export const WS_URL = import.meta.env.VITE_WS_URL 
  ? (import.meta.env.VITE_WS_URL as string).trim()
  : BACKEND_URL.startsWith('https://')
    ? BACKEND_URL.replace('https://', 'wss://')
    : BACKEND_URL.replace('http://', 'ws://');
