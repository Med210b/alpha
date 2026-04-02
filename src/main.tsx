import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker with the correct GitHub Pages base path
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // @ts-ignore - Vite handles import.meta.env during build time
    const baseUrl = import.meta.env.BASE_URL;
    
    navigator.serviceWorker.register(`${baseUrl}sw.js`)
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);