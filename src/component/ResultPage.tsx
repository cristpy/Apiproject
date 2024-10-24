
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/ResultPage.scss';

interface LocationState {
  text?: { text: string; srtPath: string }; // Update to reflect the nested structure
}

const ResultPage: React.FC = () => {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Log the state to verify data
  useEffect(() => {
    console.log('Location state:', state);
  }, [state]);

  // Handle animation delay
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  // Redirect if no transcription text is available
  useEffect(() => {
    if (!state?.text?.text) { // Access the nested text property
      console.warn('No transcription text found. Redirecting to LandingPage...');
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  // Function to download the transcription
  const downloadTranscription = () => {
    if (!state?.text?.text) {
      console.error('No transcription text to download.');
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([state.text.text], { type: 'text/plain' }); // Access the nested text property
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to download the subtitles (SRT)
  const downloadSubtitles = () => {
    if (!state?.text?.srtPath) { // Access the nested srtPath property
      console.error('No SRT path to download.');
      return;
    }

    const element = document.createElement('a');
    element.href = state.text.srtPath; // Use the nested SRT path
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
          {state?.text?.text || 'No transcription available.'} {/* Access the nested text property */}
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

      {state?.text?.srtPath && (
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
