// converter.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const ffmpeg = require('fluent-ffmpeg');

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
        await convertAudio(audioFile, convertedFilePath);

        // Upload audio to AssemblyAI
        const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', fs.createReadStream(convertedFilePath), {
            headers: {
                authorization: process.env.API_KEY, // Use your AssemblyAI API key
            },
        });

        const transcriptId = uploadResponse.data.id;

        // Request transcription
        const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: uploadResponse.data.upload_url,
        }, {
            headers: {
                authorization: process.env.API_KEY,
            },
        });

        // Poll for the transcription result
        let result;
        do {
            await new Promise(res => setTimeout(res, 5000)); // Wait for 5 seconds
            result = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    authorization: process.env.API_KEY,
                },
            });
        } while (result.data.status !== 'completed' && result.data.status !== 'failed');

        const transcription = result.data.text;

        // Clean up converted file
        fs.unlinkSync(convertedFilePath);

        return transcription;
    } catch (error) {
        console.error('Error during transcription:', error);
        throw new Error('Transcription failed');
    }
}

// Translate text using AssemblyAI
async function translateText(text, targetLanguage) {
    try {
        const translationResponse = await axios.post('https://api.assemblyai.com/v2/translate', {
            text: text,
            target_language: targetLanguage,
        }, {
            headers: {
                authorization: process.env.API_KEY,
            },
        });

        return translationResponse.data.translation;
    } catch (error) {
        console.error('Error during translation:', error);
        throw new Error('Translation failed');
    }
}

// Route for uploading audio
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        const audioFilePath = req.file.path;
        const transcription = await transcribeAudio(audioFilePath);
        const translation = await translateText(transcription, 'es'); // Translate to Spanish

        const uniqueId = uuidv4();
        const audioOutputPath = `outputs/output_${uniqueId}.mp3`; // Assuming you'll want to output an MP3 of the translation
        await convertTextToSpeech(translation, audioOutputPath);

        res.json({ 
            transcription, 
            translation, 
            audioFile: `outputs/output_${uniqueId}.mp3` 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use(cors());
