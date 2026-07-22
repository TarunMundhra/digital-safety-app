import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' ? input : input.toString();
  if (url.startsWith('/api/')) {
    const path = url.substring(5); // remove '/api/'
    if (path.startsWith('v1/')) {
      url = `/api/${path}`;
    } else if (path.startsWith('scam/sessions')) {
      url = `/api/v1/scam-sessions${path.substring(13)}`;
    } else if (path.startsWith('scam/analyze')) {
      url = `/api/v1/scam-sessions/analyze${path.substring(12)}`;
    } else {
      url = `/api/v1/${path}`;
    }
  }
  return originalFetch(url, init);
};



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
