// Required modules
const express = require(`express`);
const cors = require(`cors`);
const multer = require(`multer`);
const fs = require(`fs`);
const { Translate } = require(`@google-cloud/translate`).v2;
const speech = require(`@google-cloud/speech`);
const textToSpeech = require(`@google-cloud/text-to-speech`);
const util = require(`util`);

// Initialize Express app
const app = express();

// Use CORS middleware
app.use(cors()); // Add this line to enable CORS

// Middleware for file uploads
const upload = multer({ dest: `uploads/` });

// Add a GET route for the root URL
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Audio to Text Converter API</h1>'); // Simple message
});

// Audio transcription function
async function transcribeAudio(audioFile) {
    const client = new speech.SpeechClient();
    const audioBytes = fs.readFileSync(audioFile).toString(`base64`);
    const audio = { content: audioBytes };
    const config = {
        encoding: `LINEAR16`,
        sampleRateHertz: 16000,
        languageCode: `en-US`,
    };
    const request = { audio: audio, config };
    const [response] = await client.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(`\n`);
    console.log(`Transcription: ${transcription}`);
    return transcription;
}

// Translation function
async function translateText(text, targetLanguage) {
    const translate = new Translate();
    const [translation] = await translate.translate(text, targetLanguage);
    console.log(`Translate: ${translation}`);
    return translation;
}

// Text-to-speech function
async function convertTextToSpeech(text, outputAudioFile) {
    const client = new textToSpeech.TextToSpeechClient();
    const request = {
        input: { text: text },
        voice: { languageCode: `en-US`, ssmlGender: `NEUTRAL` },
        audioConfig: { audioEncoding: `MP3` },
    };
    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputAudioFile, response.audioContent, `binary`);
    console.log(`Audio content written to file: ${outputAudioFile}`);
}

// Route for uploading audio
app.post(`/upload-audio`, upload.single(`audio`), async (req, res) => {
    const audioFilePath = req.file.path;
    const transcription = await transcribeAudio(audioFilePath);
    const translation = await translateText(transcription, `es`);

    const audioOutputPath = `output.mp3`;
    await convertTextToSpeech(translation, audioOutputPath);

    res.json({ transcription, translation });
});

// Middleware for caching and security headers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    next();
});

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Start the server
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
