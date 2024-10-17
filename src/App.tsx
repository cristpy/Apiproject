// src/App.tsx
import React, { useState } from 'react';
import axios from 'axios';
import './App.scss'; // Import SCSS for styling

// Interface for the output structure
interface OutputData {
  transcription?: string;
  translation?: string;
  audioFile?: string;
}

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [output, setOutput] = useState<OutputData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputLang, setInputLang] = useState<string>('en'); // Input language
  const [outputLang, setOutputLang] = useState<string>('es'); // Output translation language
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAudioFile(file);
    if (file) {
      setAudioUrl(URL.createObjectURL(file)); // Audio preview
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      alert('Please select or record an audio file first.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('inputLang', inputLang); // Adding input language to the request

    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await axios.post<OutputData>(
        'http://localhost:5000/upload-audio',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data) {
        setOutput(response.data);
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to upload audio.';
      setError(message);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!output?.transcription) {
      setError('Please transcribe the audio first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<OutputData>(
        'http://localhost:5000/translate',
        {
          transcription: output.transcription,
          outputLang, // Passing output language to backend for translation
        }
      );

      if (response.data) {
        setOutput((prevOutput) => ({
          ...prevOutput,
          translation: response.data.translation,
        }));
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to translate the transcription.';
      setError(message);
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    setOutput(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Recording is not supported in this browser.');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: 'audio/wav' });
      const file = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    };

    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="container">
      <h1>Audio Transcription & Translation</h1>

      {/* File Upload & Recording Section */}
      <div className="upload-section">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={loading || isRecording}
        />

        {audioUrl && <audio controls src={audioUrl} />}

        <div className="record-section">
          {!isRecording ? (
            <button onClick={startRecording} disabled={loading}>
              Record Audio
            </button>
          ) : (
            <button onClick={stopRecording}>Stop Recording</button>
          )}
        </div>
      </div>

      {/* Language Selection Section */}
      <div className="language-section">
        <label>
          Input Language:
          <select
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
            disabled={loading}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            {/* Add more options */}
          </select>
        </label>

        <label>
          Translation Language:
          <select
            value={outputLang}
            onChange={(e) => setOutputLang(e.target.value)}
            disabled={loading}
          >
            <option value="es">Spanish</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            {/* Add more options */}
          </select>
        </label>
      </div>

      {/* Upload Button */}
      <div className="upload-button">
        <button onClick={handleUpload} disabled={loading || !audioFile}>
          {loading ? 'Processing...' : 'Upload & Transcribe'}
        </button>
      </div>

      {/* Display Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Output Section */}
      {output && (
        <div className="output-section">
          <h2>Transcription</h2>
          <p>{output.transcription || 'N/A'}</p>

          {/* Translation Section */}
          {output.transcription && (
            <>
              <button onClick={handleTranslate} disabled={loading}>
                {loading ? 'Translating...' : 'Translate'}
              </button>
              {output.translation && (
                <div className="translation-section">
                  <h2>Translation</h2>
                  <p>{output.translation}</p>
                </div>
              )}
            </>
          )}

          {/* Audio Playback */}
          {output.audioFile && (
            <div className="audio-playback">
              <h2>Uploaded Audio</h2>
              <audio controls>
                <source
                  src={`http://localhost:5000/${output.audioFile}`}
                  type="audio/mpeg"
                />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
