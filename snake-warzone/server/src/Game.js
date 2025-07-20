// Constants
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const INITIAL_BOUNDARY_RADIUS = 2000; // Half of WORLD_WIDTH/HEIGHT for a centered circle
const MIN_BOUNDARY_RADIUS = 200;
const BOUNDARY_SHRINK_DURATION = 180000; // 180 seconds in milliseconds
const SNAKE_SEGMENT_SIZE = 10; // Define a size for our pixelated snake segments

// Power-up Types
const POWER_UP_TYPES = {
    SPEED_BOOST: 'speedBoost',
    INVINCIBLE: 'invincible',
    CUTTER: 'cutter',
    MAGNET: 'magnet'
};

// Helper function for collision detection between two rectangles
function checkCollision(x1, y1, x2, y2, size) {
    return Math.abs(x1 - x2) < size && Math.abs(y1 - y2) < size;
}

// Internal Boundary Class (since it's only used by ServerGame)
class ServerBoundary {
    startTime;
    x;
    y;

    constructor() {
        this.startTime = Date.now();
        this.x = WORLD_WIDTH / 2;
        this.y = WORLD_HEIGHT / 2;
    }

    getRadius(currentTime) {
        const elapsedTime = currentTime - this.startTime;

        if (elapsedTime < BOUNDARY_SHRINK_DURATION) {
            const shrinkAmount = (INITIAL_BOUNDARY_RADIUS - MIN_BOUNDARY_RADIUS) * (elapsedTime / BOUNDARY_SHRINK_DURATION);
            return INITIAL_BOUNDARY_RADIUS - shrinkAmount;
        } else {
            const timeAfterInitialShrink = elapsedTime - BOUNDARY_SHRINK_DURATION;
            const thirtySecondIntervals = Math.floor(timeAfterInitialShrink / 30000);
            let currentRadius = MIN_BOUNDARY_RADIUS;
            for (let i = 0; i < thirtySecondIntervals; i++) {
                currentRadius /= 2;
            }
            return Math.max(currentRadius, 1);
        }
    }
}

// Internal PowerUp Class
class ServerPowerUp {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.active = true;
    }
}

// Internal Snake Class (since it's only used by ServerGame for now)
class ServerSnake {
    constructor(id, x, y, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.segments = [{ x, y }]; // Start with one segment at the head
        this.angle = 0;
        this.alive = true;
        this.color = color;
        this.speed = 100; // Pixels per second
    }

    update(deltaTime) {
        if (!this.alive) return;

        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;

        this.x += vx * (deltaTime / 1000);
        this.y += vy * (deltaTime / 1000);

        this.x = (this.x + WORLD_WIDTH) % WORLD_WIDTH;
        this.y = (this.y + WORLD_HEIGHT) % WORLD_HEIGHT;

        // Add new head segment and remove tail segment (for constant length)
        this.segments.unshift({ x: this.x, y: this.y });
        // For now, keep snake length constant. Later, grow by eating pellets.
        if (this.segments.length > 10) { // Example length
            this.segments.pop();
        }
    }

    getState() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            segments: this.segments,
            angle: this.angle,
            alive: this.alive,
            color: this.color
        };
    }
}

class ServerGame {
    players = [];
    food;
    scores = {};
    nextPlayerId = 1;
    nextPowerUpId = 1; // New: ID for power-ups
    powerUps = []; // New: Array to store active power-ups
    boundary;
    gameStartTime;
    foodPellets = [];

    constructor() {
        this.food = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
        this.boundary = new ServerBoundary();
        this.gameStartTime = Date.now();
    }

    addPlayer() {
        const playerId = this.nextPlayerId++;
        const player = new ServerSnake(playerId, Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, '#FFFFFF');
        this.players.push(player);
        this.scores[playerId] = 0;
        return player.getState(); // Return initial state to client
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        delete this.scores[playerId];
    }

    spawnPowerUp() {
        const typeKeys = Object.keys(POWER_UP_TYPES);
        const randomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const currentRadius = this.boundary.getRadius(Date.now());
        
        // Spawn within 200px of current boundary edge
        const spawnDistance = currentRadius - 200;
        const angle = Math.random() * Math.PI * 2;
        const x = this.boundary.x + spawnDistance * Math.cos(angle);
        const y = this.boundary.y + spawnDistance * Math.sin(angle);

        const powerUp = new ServerPowerUp(this.nextPowerUpId++, POWER_UP_TYPES[randomType], x, y);
        this.powerUps.push(powerUp);
    }

    update(deltaTime) {
        const currentBoundaryRadius = this.boundary.getRadius(Date.now());

        // Spawn power-ups (example: spawn every 5 seconds if less than 5 power-ups)
        if (Math.random() < 0.01 && this.powerUps.length < 5) { // Adjust spawn rate as needed
            this.spawnPowerUp();
        }

        for (const player of this.players) {
            if (player.alive) {
                player.update(deltaTime);

                // --- Collision Detection ---

                // 1. Self-collision
                for (let i = 1; i < player.segments.length; i++) {
                    if (checkCollision(player.x, player.y, player.segments[i].x, player.segments[i].y, SNAKE_SEGMENT_SIZE)) {
                        player.alive = false;
                        console.log(`Player ${player.id} hit itself!`);
                        break;
                    }
                }
                if (!player.alive) {
                    for (const segment of player.segments) {
                        this.foodPellets.push({ x: segment.x, y: segment.y, type: 'score' });
                    }
                    continue;
                }

                // 2. Snake-to-snake collision (head-to-body)
                for (const otherPlayer of this.players) {
                    if (player.id === otherPlayer.id || !otherPlayer.alive) continue;

                    for (const segment of otherPlayer.segments) {
                        if (checkCollision(player.x, player.y, segment.x, segment.y, SNAKE_SEGMENT_SIZE)) {
                            player.alive = false;
                            console.log(`Player ${player.id} hit Player ${otherPlayer.id}!`);
                            break;
                        }
                    }
                    if (!player.alive) {
                        for (const segment of player.segments) {
                            this.foodPellets.push({ x: segment.x, y: segment.y, type: 'score' });
                        }
                        continue;
                    }
                }
                if (!player.alive) continue;

                // 3. Boundary collision
                const distanceToBoundaryCenter = Math.sqrt(
                    Math.pow(player.x - this.boundary.x, 2) +
                    Math.pow(player.y - this.boundary.y, 2)
                );

                if (distanceToBoundaryCenter > currentBoundaryRadius) {
                    player.alive = false;
                    console.log(`Player ${player.id} hit the boundary!`);
                    for (const segment of player.segments) {
                        this.foodPellets.push({ x: segment.x, y: segment.y, type: 'score' });
                    }
                }

                // 4. Power-up collision
                for (let i = this.powerUps.length - 1; i >= 0; i--) {
                    const powerUp = this.powerUps[i];
                    if (checkCollision(player.x, player.y, powerUp.x, powerUp.y, SNAKE_SEGMENT_SIZE)) {
                        console.log(`Player ${player.id} collected ${powerUp.type} power-up!`);
                        // Apply power-up effect (for now, just log)
                        // This is where actual power-up effects would be implemented
                        this.powerUps.splice(i, 1); // Remove collected power-up
                    }
                }
            }
        }
    }

    getGameState() {
        return {
            players: this.players.map(p => p.getState()),
            food: this.food,
            scores: this.scores,
            boundaryRadius: this.boundary.getRadius(Date.now()),
            foodPellets: this.foodPellets,
            powerUps: this.powerUps // Include power-ups in game state
        };
    }
}
module.exports = { ServerGame };