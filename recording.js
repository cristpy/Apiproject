let mediaRecorder;
let audioChunks = [];

navigator.mediaDevices.getUserMedia({ audio: true})
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: `audio/wav`});
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();

            sendAudioToBackend(audioBlob);
        };
    });

function startRecording() {
    audioChunks = [];
    mediaRecorder.start();
}

function stopRecordig() {
    mediaRecorder.stop();
}

function sendAudioToBackend(audioBlob) {
    const formData = new FormData();
    formData.append(`audio`, audioBlob, `recording.wav`);

    fetch(`/upload-audio`,{
        method: `POST`,
        body: formData
    }).then(response => response.json())
      .then(data => {
        console.log(`Transcription:`, data.transcription);
        console.log(`Translation:`, data.translation);
      });
}