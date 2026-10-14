import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './vendor/fontawesome/css/all.min.css';

// Immediately apply stored theme to document element to prevent flash of wrong theme
try {
  const systemState = JSON.parse(localStorage.getItem('ultrasudo_system_store') || '{}');
  const savedTheme = systemState.state?.theme || 'default';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const savedBg = localStorage.getItem('desktop_custom_bg');
  if (savedBg) {
    document.body.style.backgroundImage = `url("${savedBg}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  }
} catch (_) {
  document.documentElement.setAttribute('data-theme', 'default');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
