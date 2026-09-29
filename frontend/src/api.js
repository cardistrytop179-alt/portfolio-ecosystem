// Base URL for all backend API calls.
// In development, Vite proxies /api → localhost:3001, so we use ''.
// In production the frontend is on Vercel and the backend runs on our own
// VPS behind nginx + Let's Encrypt. Override via VITE_BACKEND_URL at build time
// if you move it elsewhere.
export const API = import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? '' : 'https://213-108-20-3.sslip.io')
