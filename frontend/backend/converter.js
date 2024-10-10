require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const ffmpeg = require('fluent-ffmpeg');
const WebSocket = require('ws');

const app = express();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS settings
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST'] }));

// Multer settings for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) cb(null, true);
        else cb(new Error('Invalid file type'), false);
    }
});

// Serve static files
app.use('/outputs', express.static('outputs'));

// Basic root route
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Audio to Text Converter API</h1>');
});

// Audio conversion function
function convertAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions(['-ar 16000', '-ac 1', '-f wav'])
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
}

// Audio transcription
async function transcribeAudio(audioFile) {
    try {
        const convertedFilePath = `converted_${audioFile}.wav`;
        await convertAudio(audioFile, convertedFilePath);

        const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', fs.createReadStream(convertedFilePath), {
            headers: { authorization: process.env.API_KEY },
        });

        const transcriptId = uploadResponse.data.id;

        // Request transcription
        const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: uploadResponse.data.upload_url,
        }, { headers: { authorization: process.env.API_KEY } });

        // Poll for the transcription result
        let result;
        do {
            await new Promise(res => setTimeout(res, 5000)); // Wait for 5 seconds
            result = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: { authorization: process.env.API_KEY },
            });
        } while (result.data.status !== 'completed' && result.data.status !== 'failed');

        fs.unlinkSync(convertedFilePath);
        return result.data.text;
    } catch (error) {
        console.error('Transcription error:', error);
        throw new Error('Transcription failed');
    }
}

// Route for uploading audio via file
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }
        const transcription = await transcribeAudio(req.file.path);
        res.json({ transcription });
    } catch (error) {
        console.error('Error handling audio file:', error);
        res.status(500).json({ error: 'Failed to process audio file' });
    }
});

// WebSocket server
const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    ws.on('message', (message) => {
        console.log('Received:', message);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Start server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
    