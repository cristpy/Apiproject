let mediaRecorder;
let audioChunks = [];

// Request access to the user's microphone and setup media recorder
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        // Handle stop event and create an audio blob for playback and sending to the server
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play(); // Play the recorded audio

            // Send audio blob to the backend for transcription, translation, etc.
            sendAudioToBackend(audioBlob);
        };
    })
    .catch(error => {
        console.error("Error accessing the microphone: ", error);
    });

// Function to start recording
function startRecording() {
    audioChunks = [];
    mediaRecorder.start();
}

// Function to stop recording
function stopRecording() {  // Corrected typo here
    mediaRecorder.stop();
}

// Function to send the recorded audio to the backend
function sendAudioToBackend(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    fetch('/upload-audio', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log('Transcription:', data.transcription);
        console.log('Translation:', data.translation);
    })
    .catch(error => {
        console.error('Error uploading the audio:', error);
    });
}
