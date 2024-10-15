// src/App.js

import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
    const [audioFile, setAudioFile] = useState(null);
    const [output, setOutput] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        setAudioFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!audioFile) {
            alert('Please select an audio file first.');
            return;
        }

        const formData = new FormData();
        formData.append('audio', audioFile);

        setLoading(true);
        setError(null);
        setOutput(null);

        try {
            const response = await axios.post('http://localhost:5000/upload-audio', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Check if the response has the expected structure
            if (response.data && response.data.transcription) {
                setOutput(response.data);
            } else {
                setError('Unexpected response structure');
            }
        } catch (err) {
            setError('Failed to upload audio file');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Audio Upload and Transcription</h1>
            <input type="file" accept="audio/*" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Audio'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {output && (
                <div>
                    <h2>Output:</h2>
                    <p><strong>Transcription:</strong> {output.transcription}</p>
                    <p><strong>Translation:</strong> {output.translation}</p>
                    <audio controls>
                        <source src={`http://localhost:5000/${output.audioFile}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
};

export default App;
