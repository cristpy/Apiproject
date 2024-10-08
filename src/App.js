import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [transcription, setTranscription] = useState('');
    const [translation, setTranslation] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [uploadedAudioFile, setUploadedAudioFile] = useState(null); // State to hold uploaded file
    const [audioFileUrl, setAudioFileUrl] = useState(''); // State to hold URL input
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const socketRef = useRef(null);

    // WebSocket connection
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:5001');
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
            console.log('Message from server:', event.data);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
        };

        return () => {
            socket.close();
        };
    }, []);

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
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setTranscription(response.data.transcription);
            setTranslation(response.data.translation);
            setAudioUrl(`http://localhost:5000/${response.data.audioFile}`);

            // Optionally notify the WebSocket server
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send('Audio uploaded successfully');
            }
        } catch (error) {
            console.error('Error uploading the audio:', error);
            alert('Failed to upload audio. Please check the server.');
        }
    };

    const handleFileChange = (event) => {
        setUploadedAudioFile(event.target.files[0]); // Update state with selected file
    };

    const uploadFile = async (event) => {
        event.preventDefault(); // Prevent default form submission
        if (!uploadedAudioFile) {
            console.error("No audio file selected");
            return;
        }

        const formData = new FormData();
        formData.append('audio', uploadedAudioFile, uploadedAudioFile.name);

        try {
            const response = await axios.post('http://localhost:5000/upload-audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setTranscription(response.data.transcription);
            setTranslation(response.data.translation);
            setAudioUrl(`http://localhost:5000/${response.data.audioFile}`);

            // Optionally notify the WebSocket server
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send('File uploaded successfully');
            }
        } catch (error) {
            console.error('Error uploading the audio file:', error);
            alert('Failed to upload audio file. Please check the server.');
        }
    };

    const handleUrlChange = (event) => {
        setAudioFileUrl(event.target.value); // Update state with URL input
    };

    const uploadUrl = async () => {
        if (!audioFileUrl) {
            alert('Please enter a valid audio URL.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/upload-audio', { url: audioFileUrl });
            setTranscription(response.data.transcription);
            setTranslation(response.data.translation);
        } catch (error) {
            console.error('Error uploading the audio URL:', error);
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

            <h2>Upload Audio File</h2>
            <form onSubmit={uploadFile}>
                <input type="file" accept="audio/*" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>

            <h2>Upload Audio URL</h2>
            <input type="text" value={audioFileUrl} onChange={handleUrlChange} placeholder="Enter audio URL" />
            <button onClick={uploadUrl}>Upload URL</button>
        </div>
    );
}

export default App;
