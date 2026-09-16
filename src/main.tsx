import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorker.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Left until after the first render is queued: registration waits for the load
// event anyway, and nothing on screen depends on it.
registerServiceWorker();
