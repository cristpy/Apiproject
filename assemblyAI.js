// assemblyAI.js
const axios = require('axios');

const API_KEY = "9de2fbebe2aa43e0a63007abd7eeb2bf"; 

async function transcribeAudio(audioUrl) {
    try {
        // Start the transcription
        const response = await axios.post('https://api.assemblyai.com/v2/upload', {
            headers: {
                authorization: API_KEY,
            },
            data: {
                audio_url: audioUrl, // URL of the audio file you want to transcribe
            },
        });

        const transcriptId = response.data.id;

        // Poll for the transcription result
        let result;
        do {
            result = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    authorization: API_KEY,
                },
            });
        } while (result.data.status !== 'completed' && result.data.status !== 'failed');

        return result.data;
    } catch (error) {
        console.error('Error transcribing audio:', error);
    }
}

// Example usage
const audioUrl = 'https://storage.googleapis.com/aai-docs-samples/sports_injuries.mp3'; 
transcribeAudio(audioUrl).then(transcription => {
    console.log('Transcription:', transcription);
});
