const http = require('http');
const WebSocket = require('ws');
const express = require('express');

// Set up HTTP server with Express
const app = express();
app.use(express.static('public')); // Serve static files

// Create an HTTP server and attach it to the WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Game state
let gameState = {
  players: [], // Array of player objects with position, velocity, etc.
  food: { x: 0, y: 0 }, // Food position
};

// Player object structure
function createPlayer(id) {
  return {
    id,
    x: Math.random() * 800,
    y: Math.random() * 600,
    segments: [{ x: 0, y: 0 }],
    direction: { x: 0, y: 0 },
    alive: true,
  };
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Generate a unique ID for the player
  const playerId = Date.now();
  const player = createPlayer(playerId);

  // Add player to game state
  gameState.players.push(player);

  // Send current game state to new player
  ws.send(JSON.stringify({ type: 'init', data: gameState }));

  // Handle incoming messages from client
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'move':
        // Update player's direction based on input
        player.direction = data.direction;
        break;

      default:
        console.log(`Unknown message type: ${data.type}`);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client disconnected: ${playerId}`);

    // Remove player from game state
    gameState.players = gameState.players.filter(p => p.id !== playerId);
  });
});

// Game loop to update and broadcast game state
setInterval(() => {
  if (gameState.players.length === 0) return;

  // Update each player's position based on direction
  for (let player of gameState.players) {
    if (!player.alive) continue;

    // Update head position
    const head = { x: player.x, y: player.y };
    player.x += player.direction.x;
    player.y += player.direction.y;

    // Check collision with walls
    if (player.x < 0 || player.x > 800 || player.y < 0 || player.y > 600) {
      player.alive = false;
    }

    // Check collision with food
    if (
      Math.abs(player.x - gameState.food.x) < 15 &&
      Math.abs(player.y - gameState.food.y) < 15
    ) {
      // Player eats food - grow snake and place new food
      player.segments.push(head);
      gameState.food = { x: Math.random() * 800, y: Math.random() * 600 };
    }

    // Update segments (simplified for demo)
    for (let i = player.segments.length - 1; i > 0; i--) {
      const nextSegment = player.segments[i - 1];
      player.segments[i].x = nextSegment.x;
      player.segments[i].y = nextSegment.y;
    }
    if (player.segments.length > 0) {
      player.segments[0].x = head.x;
      player.segments[0].y = head.y;
    }
  }

  // Broadcast updated game state to all clients
  const message = JSON.stringify({ type: 'update', data: gameState });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}, 100);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);

  // Place food at a random position when server starts
  gameState.food = { x: Math.random() * 800, y: Math.random() * 600 };
});