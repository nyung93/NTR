import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AuthGate from './AuthGate';
import './styles.css';
import './glass-theme.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>{user => <App key={user.uid} uid={user.uid} />}</AuthGate>
  </React.StrictMode>
);
