import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './component-details.css';
import './workspace.css';
import './billow.css';
import './date-time.css';
import './dashboard-v2.css';
import './select.css';
import './navigation.css';
import './motion.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
