import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Ensure you have an App.js file in src
import './index.css'; // Optional if you have a CSS file

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);