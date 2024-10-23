// client/src/components/LoadingSpinner.tsx
import React from 'react';
import '../styles/LoadingSpinner.scss';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
