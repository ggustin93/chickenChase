import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import { ReactPlugin } from '@stagewise-plugins/react';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialiser la barre d'outils Stagewise séparément
const toolbarConfig = {
  plugins: [ReactPlugin], // Ajouter le plugin React pour une meilleure expérience
};

// Créer un élément racine séparé pour la barre d'outils
document.addEventListener('DOMContentLoaded', () => {
  const toolbarRoot = document.createElement('div');
  toolbarRoot.id = 'stagewise-toolbar-root';
  document.body.appendChild(toolbarRoot);

  createRoot(toolbarRoot).render(
    <React.StrictMode>
      <StagewiseToolbar config={toolbarConfig} />
    </React.StrictMode>
  );
});