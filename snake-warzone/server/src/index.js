const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { ServerGame } = require('./Game.js'); // Import the server-side Game class

const app = express();
app.use(express.static('../dist')); // Serve client-side build from Vite's dist folder

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const game = new ServerGame(); // Instantiate the server-side game

wss.on('connection', (ws) => {
    console.log('New client connected to server');
    const player = game.addPlayer(); // Add a new player to the game
    ws.playerId = player.id; // Attach player ID to WebSocket connection

    // Send initial game state to the new client
    ws.send(JSON.stringify({ type: 'init', data: game.getGameState(), playerId: player.id }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type === 'move') {
            const playerToUpdate = game.players.find(p => p.id === parsedMessage.playerId);
            if (playerToUpdate) {
                playerToUpdate.angle = parsedMessage.angle; // Update player angle based on client input
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${ws.playerId}`);
        game.removePlayer(ws.playerId);
    });
});

// Game loop for server
let lastUpdateTime = Date.now();
setInterval(() => {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdateTime;
    game.update(deltaTime); // Update server-side game state
    lastUpdateTime = currentTime;

    // Broadcast updated game state to all clients
    const gameState = game.getGameState();
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'update', data: gameState }));
        }
    });
}, 1000 / 60); // 60 updates per second

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});