// Constants
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;

// PlayerState and SnakeSegment types (defined as JSDoc types for plain JavaScript)
/**
 * @typedef {object} SnakeSegment
 * @property {number} x - X coordinate of the segment.
 * @property {number} y - Y coordinate of the segment.
 */

/**
 * @typedef {object} PlayerState
 * @property {number} id - Unique player identifier.
 * @property {number} x - X coordinate of the snake's head.
 * @property {number} y - Y coordinate of the snake's head.
 * @property {SnakeSegment[]} segments - Array of snake segments.
 * @property {number} angle - Current movement angle in radians.
 * @property {boolean} alive - True if the snake is alive.
 * @property {string} color - Snake color.
 */

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

        this.segments[0] = { x: this.x, y: this.y };
    }

    // Method to get the current state for sending to clients
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
module.exports = { ServerSnake };