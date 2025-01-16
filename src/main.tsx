import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { backgroundSync } from './utils/backgroundSync';
import { pushNotifications } from './utils/pushNotifications';

// Initialize core services
backgroundSync.init().catch(console.error);
pushNotifications.init().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);