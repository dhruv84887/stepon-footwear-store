import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './premium.css';
import './admin.css';
import './theme.css';
import './glass.css';
import './commerce.css';
import './readability.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
