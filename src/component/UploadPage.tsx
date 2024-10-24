// client/src/components/UploadPage.tsx
import React, { useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import '../styles/UploadPage.scss';

const UploadPage: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [srtFilePath, setSrtFilePath] = useState<string | null>(null);
  const [transcribe, setTranscribe] = useState<boolean>(true);
  const [generateSubtitles, setGenerateSubtitles] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('transcribe', String(transcribe));
    formData.append('generateSubtitles', String(generateSubtitles));

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await axios.post('http://localhost:5000/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      setSuccess(true);
      setSrtFilePath(response.data.srtPath); // Get the SRT file path from the response

      // Navigate to the result page after a delay
      setTimeout(() => {
        navigate('/result', { state: { text: response.data.transcription, srtPath: response.data.srtPath } });
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload and process audio file.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload Your Audio</h2>
      <motion.input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="file-input"
      />

      <div className="options">
        <label>
          <input 
            type="checkbox" 
            checked={transcribe} 
            onChange={() => setTranscribe(!transcribe)} 
          />
          Transcribe Audio
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={generateSubtitles} 
            onChange={() => setGenerateSubtitles(!generateSubtitles)} 
          />
          Generate Subtitles (SRT)
        </label>
      </div>

      {loading && <LoadingSpinner />} {/* Show spinner during loading */}

      {error && <div className="error-message">{error}</div>}

      {success && (
        <div className="success-message">
          Successfully uploaded! 
          {srtFilePath && (
            <span>
              {' '}
              <a href={srtFilePath} download>Download Subtitles (SRT)</a>
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="progress-bar">
          <motion.div
            style={{ width: `${uploadProgress}%` }}
            className={`progress ${uploadProgress === 100 ? 'complete' : ''}`}
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
