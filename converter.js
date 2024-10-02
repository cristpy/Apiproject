// Audio-to-Text(Speech Recognition)
const speech = require(`@google-cloud/speech`);
const fs = require('fs'); // Declare fs only once
const { Translate } = require(`@google-cloud/translate`).v2;
const textToSpeech = require(`@google-cloud/text-to-speech`);
const util = require(`util`);
const express = require(`express`);
const multer = require(`multer`);

async function transcribeAudio(audioFile) {
    const client = new speech.SpeechClient(); // Declare client here
    const audioBytes = fs.readFileSync(audioFile).toString(`base64`); // Correct the typo here
    const audio = {
        content: audioBytes,
    };
    const config = {
        encoding: `LINEAR16`,
        sampleRateHertz: 16000, // Corrected the typo here
        languageCode: `en-US`, // Corrected the typo here
    };
    const request = {
        audio: audio,
        config,
    };
    const [response] = await client.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(`\n`);
    console.log(`Transcription: ${transcription}`);
    return transcription;
}

// Translation (Google Cloud Translation API)
async function translateText(text, targetLanguage) {
    const translate = new Translate();
    const [translation] = await translate.translate(text, targetLanguage);
    console.log(`Translate: ${translation}`);
    return translation;
}

// Text-to-Speech (Google Cloud TTS)
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

const app = express();
const upload = multer({ dest: `uploads/` });

app.post(`/upload-audio`, upload.single(`audio`), async (req, res) => {
    const audioFilePath = req.file.path;
    const transcription = await transcribeAudio(audioFilePath);
    const translation = await translateText(transcription, `es`);

    const audioOutputPath = `output.mp3`;
    await convertTextToSpeech(translation, audioOutputPath); // Fixed typo here

    res.json({ transcription, translation });
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
