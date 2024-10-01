// Audio-to-Text(Speech Recognition)
const speech = require(`@google-cloud/speech`);
const fs = require('fs');

async function transcribeAudio(audioFile) {
    const client = new fs.readFileSync(audioFile).toString(`based64`);

    const audio = {
        content: audioBytes,
    };
    const config = {
        encoding: `LINEAR16`,
        sammpleRateHertz: 16000,
        languege: `en-US`,
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
const {Translate } = require(`@google-cloud/translate`).v2;

async function translateText(text, targetLanguage) {
    const translate = new Translate();
    const [translation] = await translate.translate(text, targetLanguage);
    console.log(`Translate: ${translation}`);
    return translation;
    
}

// Text-to-Speech (Google Cloud TTS)

const textToSpeech = require(`@google-cloud/text-to-speech`);
const fs = require(`fs`);
const util = require(`util`);

async function convertTextToSpeech(text, outputAudioFile) {
    const client = new textToSpeech.TextToSpeechClient();
    const request = {
        input: {text: text },
        voice: {languageCode: `en-US`, ssmlGender: `NEUTRAL`},
        audioConfig: { audioEncoding: `MP3`},
    };

    const [response] = await client .synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputAudioFile, response.audioContent, `binary`);
    console.log(`Audio content written to file: ${outputAudioFile}`);
}
