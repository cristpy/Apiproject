const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5001 }); // Choose a port that's not in use

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Optionally, send a response back to the client
        ws.send('Message received');
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:5001');
