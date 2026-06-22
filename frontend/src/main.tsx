import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' ? input : input.toString();
  if (url.startsWith('/api/')) {
    const apiBase = "http://localhost:8000/api/v1";
    const path = url.substring(5); // remove '/api/'
    if (path.startsWith('scam/sessions')) {
      url = `${apiBase}/scam-sessions${path.substring(13)}`;
    } else if (path.startsWith('scam/analyze')) {
      url = `${apiBase}/scam-sessions/analyze${path.substring(12)}`;
    } else {
      url = `${apiBase}/${path}`;
    }
  }
  return originalFetch(url, init);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
