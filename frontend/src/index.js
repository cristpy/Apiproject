import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Ensure this path is correct

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element not found"); // This will help in debugging
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
