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
}