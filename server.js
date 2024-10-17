// server.js
// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const converter = require('./converter'); // Import the converter logic

// const app = express();
// const upload = multer({ dest: 'uploads/' }); // Save files to the 'uploads' directory

// app.use(cors());
// app.use(express.json()); // Enable JSON parsing

// // Route to handle audio upload and processing
// app.post('/upload-audio', upload.single('audio'), async (req, res) => {
//   try {
//     console.log('File uploaded:', req.file);

//     // Ensure the file is uploaded correctly
//     if (!req.file) {
//       return res.status(400).json({ error: 'No audio file uploaded' });
//     }

//     // Process the uploaded audio using the converter logic
//     const transcription = await converter.transcribeAudio(req.file.path);
//     const translation = await converter.translateText(transcription, 'es');
//     const audioFile = await converter.convertTextToSpeech(
//       translation,
//       `outputs/output_${Date.now()}.mp3`
//     );

//     // Send the response with transcription, translation, and audio path
//     res.json({ transcription, translation, audioFile });
//   } catch (error) {
//     console.error('Error:', error.message);
//     res.status(500).json({ error: 'Failed to process the audio' });
//   }
// });

// app.listen(5000, () => {
//   console.log('HTTP server is running on http://localhost:5000');
// });
