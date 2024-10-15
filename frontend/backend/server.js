const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Save files to the 'uploads' directory

app.use(cors());

app.post('/upload-audio', upload.single('audio'), (req, res) => {
  console.log('File uploaded:', req.file);
  res.send('Audio uploaded successfully');
});

app.listen(5000, () => {
  console.log('HTTP server is running on http://localhost:5000');
});
