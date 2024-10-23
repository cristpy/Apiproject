// client/src/components/ResultPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/ResultPage.scss';

interface LocationState {
  text?: string;
  srtPath?: string; // Added to handle the SRT file path
}

const ResultPage: React.FC = () => {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Handle animation delay
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  // Redirect if no transcription text is available
  useEffect(() => {
    if (!state?.text) {
      console.warn('No transcription text found. Redirecting to LandingPage...');
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  // Function to download the transcription
  const downloadTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([state?.text || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to download the subtitles (SRT)
  const downloadSubtitles = () => {
    if (!state?.srtPath) return;

    const element = document.createElement('a');
    element.href = state.srtPath; // Set the SRT path
    element.download = 'subtitles.srt'; // Specify the filename
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div
      className="result-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h2>Transcription Result</h2>
      {isVisible && (
        <motion.div
          className="transcription-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {state?.text || 'No transcription available.'}
        </motion.div>
      )}

      <motion.button
        className="download-button"
        onClick={downloadTranscription}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        Download Transcription
      </motion.button>

      {state?.srtPath && (
        <motion.button
          className="download-button"
          onClick={downloadSubtitles}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Download Subtitles (SRT)
        </motion.button>
      )}
    </motion.div>
  );
};

export default ResultPage;
