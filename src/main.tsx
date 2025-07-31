import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Import PWA Elements for web camera support
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Development utilities - expose database initialization functions
if (process.env.NODE_ENV === 'development') {
  import('./utils/databaseInit').then(({ initializeChallenges, initializeDatabase, checkDatabaseStatus }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).initializeChallenges = initializeChallenges;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).initializeDatabase = initializeDatabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).checkDatabaseStatus = checkDatabaseStatus;
    console.log('🔧 Dev utils available: window.initializeChallenges(), window.initializeDatabase(), window.checkDatabaseStatus()');
  });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize PWA Elements for web camera support
defineCustomElements(window);

// Register service worker for PWA support
serviceWorkerRegistration.register();