import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AuthGate from './AuthGate';
import './styles.css';
import './glass-theme.css';
import './trip-features.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>{(user, isAdmin) => <App key={user.uid} user={user} uid={user.uid} isAdmin={isAdmin} />}</AuthGate>
  </React.StrictMode>
);
