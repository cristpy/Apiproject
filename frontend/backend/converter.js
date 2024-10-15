// converter.js
require('dotenv').config(); 
console.log('Loaded API Key:', process.env.API_KEY);


const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const ffmpeg = require('fluent-ffmpeg');
const WebSocket = require('ws');
const textToSpeech = require('@google-cloud/text-to-speech'); // Import Google Cloud Text-to-Speech
const client = new textToSpeech.TextToSpeechClient(); // Create a client

// Initialize Express app
const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Use CORS middleware
app.use(cors({
    origin: 'http://localhost:3000', // Update with your frontend's origin
    methods: ['GET', 'POST'],
}));

// Middleware for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Serve static files from the 'outputs' directory
app.use('/outputs', express.static('outputs'));

// Add a GET route for the root URL
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Audio to Text Converter API</h1>');
});

// Function to convert audio to LINEAR16 format with 16000 Hz sample rate
function convertAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-ar 16000', // Set audio sampling rate to 16000 Hz
                '-ac 1',     // Set number of audio channels to 1
                '-f wav'     // Set output format to WAV
            ])
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
}

// Transcribe audio using AssemblyAI
async function transcribeAudio(audioFile) {
    try {
        const convertedFilePath = `converted_${audioFile}.wav`;
        console.log(`Converting audio to: ${convertedFilePath}`);
        await convertAudio(audioFile, convertedFilePath);

        console.log('Uploading audio to AssemblyAI...');
        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload', 
            fs.createReadStream(convertedFilePath), 
            { headers: { authorization: process.env.API_KEY } }
        );
        console.log('Upload Response:', uploadResponse.data);

        const transcriptId = uploadResponse.data.id;
        console.log(`Transcript ID: ${transcriptId}`);

        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript', 
            { audio_url: uploadResponse.data.upload_url }, 
            { headers: { authorization: process.env.API_KEY } }
        );
        console.log('Transcript Request Response:', transcriptResponse.data);

        // Poll for transcription result
        let result;
        do {
            console.log('Polling for transcription result...');
            await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds
            result = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`, 
                { headers: { authorization: process.env.API_KEY } }
            );
            console.log('Polling Response:', result.data);
        } while (result.data.status !== 'completed' && result.data.status !== 'failed');

        const transcription = result.data.text;
        console.log('Transcription:', transcription);

        fs.unlinkSync(convertedFilePath); // Clean up the converted file
        return transcription;
    } catch (error) {
        console.error('Error during transcription:', error.response ? error.response.data : error.message);
        throw new Error('Transcription failed');
    }
}

// Convert text to speech using Google Cloud Text-to-Speech
async function convertTextToSpeech(text, outputPath) {
    const request = {
        input: { text: text },
        voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-A' }, // Spanish voice
        audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    fs.writeFileSync(outputPath, response.audioContent, 'binary');
}

// Route for uploading audio
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        // Ensure the file was uploaded successfully
        if (!req.file) {
            throw new Error('No audio file uploaded');
        }

        const audioFilePath = req.file.path;
        console.log(`Audio file uploaded: ${audioFilePath}`);

        // Step 1: Transcribe the audio
        const transcription = await transcribeAudio(audioFilePath);
        console.log(`Transcription: ${transcription}`);

        // Step 2: Translate the transcription (e.g., to Spanish)
        const translation = await translateText(transcription, 'es');
        console.log(`Translation: ${translation}`);

        // Step 3: Convert the translation to speech and save it as an MP3
        const uniqueId = uuidv4();
        const audioOutputPath = `outputs/output_${uniqueId}.mp3`;
        console.log(`Saving translated audio to: ${audioOutputPath}`);
        await convertTextToSpeech(translation, audioOutputPath);

        // Send the response to the client
        res.json({
            transcription,
            translation,
            audioFile: `outputs/output_${uniqueId}.mp3`
        });

    } catch (error) {
        console.error('Error during audio processing:', error);
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up uploaded audio file to save space
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`Uploaded file deleted: ${req.file.path}`);
            } catch (unlinkError) {
                console.error(`Failed to delete uploaded file: ${unlinkError.message}`);
            }
        }
    }
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    ws.on('message', (message) => {
        console.log('Received:', message);
        // You can handle incoming messages here
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Upgrade HTTP server to handle WebSocket connections
const server = app.listen(process.env.PORT || 5001, () => {
    console.log(`Server is running on port ${process.env.PORT || 5001}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
