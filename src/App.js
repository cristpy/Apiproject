import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Create a WebSocket connection when the component mounts
    const socket = new WebSocket('ws://localhost:5001');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
      // Handle incoming messages from the WebSocket server if needed
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function to close the WebSocket when the component unmounts
    return () => {
      socket.close();
    };
  }, []); // Empty dependency array means this runs once when the component mounts

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);
          sendAudioToBackend(audioBlob);
          audioChunksRef.current = [];
        };
        mediaRecorderRef.current.start();
      })
      .catch(error => {
        console.error("Error accessing the microphone: ", error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await axios.post('http://localhost:5000/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTranscription(response.data.transcription);
      setTranslation(response.data.translation);
      setAudioUrl(`http://localhost:5000/${response.data.audioFile}`);
    } catch (error) {
      console.error('Error uploading the audio:', error);
    }
  };

  return (
    <div className="App">
      <h1>Audio to Text Converter</h1>
      <div>
        <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording}>Stop Recording</button>
      </div>
      {audioUrl && <audio controls src={audioUrl}></audio>}
      {transcription && <p><strong>Transcription:</strong> {transcription}</p>}
      {translation && <p><strong>Translation:</strong> {translation}</p>}
    </div>
  );
}

export default App;
