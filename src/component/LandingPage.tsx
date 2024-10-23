// client/src/components/LandingPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../styles/LandingPage.scss';

const LandingPage: React.FC = () => {
  const navigate = useNavigate(); 

  const navigateToUpload = () => {
    navigate('/upload'); 
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Audio to Text Converter</h1>
        <p>Convert your audio files to text in just a few clicks</p>
      </header>
      <button onClick={navigateToUpload} className="upload-button">
        Upload File Now
      </button>
    </div>
  );
};

export default LandingPage;
