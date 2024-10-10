const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory (if you have any static assets)
app.use(express.static(path.join(__dirname, 'public')));

// Root route for testing
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Audio to Text Converter Server</h1>');
});

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Handle general errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
