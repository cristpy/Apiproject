// assemblyAI.js
const axios = require('axios');
const fs = require('fs');

const apikey = process.env.API_KEY; // Replace with your actual AssemblyAI API key

async function uploadAudio(filePath) {
    const audioData = fs.readFileSync(filePath); // Read the audio file
    const response = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {  
        headers: {
            'authorization': apikey,
            'Content-Type': 'application/octet-stream', // Change to application/octet-stream
        },
    });

    return response.data.upload_url; // Return the uploaded audio URL
}

async function transcribeAudio(audioUrl) {
    try {
        // Start the transcription
        const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: audioUrl, // URL of the uploaded audio file
        }, {
            headers: {
                'authorization': apikey,
            },
        });

        const transcriptId = response.data.id;

        // Poll for the transcription result
        let result;
        do {
            await new Promise(res => setTimeout(res, 3000)); // Wait for 3 seconds
            result = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'authorization': apikey,
                },
            });
        } while (result.data.status !== 'completed' && result.data.status !== 'failed');

        // Check for errors in the transcription result
        if (result.data.status === 'failed') {
            throw new Error('Transcription failed');
        }

        return result.data.text; // Return the transcribed text
    } catch (error) {
        console.error('Error transcribing audio:', error.response ? error.response.data : error.message);
        throw error; // Rethrow error for further handling
    }
}

// Example usage (comment this out in production)
(async () => {
    const filePath = 'C:\\Users\\MIS\\Desktop\\fileaudio\\cording.mp3'; // Use double backslashes for Windows paths
    try {
        const uploadUrl = await uploadAudio(filePath);
        console.log('Uploaded audio URL:', uploadUrl);
        const transcription = await transcribeAudio(uploadUrl);
        console.log('Transcription:', transcription);
    } catch (error) {
        console.error('Error:', error);
    }
})();

module.exports = { uploadAudio, transcribeAudio }; // Export functions for use in other files
