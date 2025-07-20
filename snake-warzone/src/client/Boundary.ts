// Constants (embedded for simplicity due to module resolution issues)
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const INITIAL_BOUNDARY_RADIUS = 2000; // Half of WORLD_WIDTH/HEIGHT for a centered circle
const MIN_BOUNDARY_RADIUS = 200;
const BOUNDARY_SHRINK_DURATION = 180000; // 180 seconds in milliseconds

/**
 * @class Boundary
 * @description Manages the shrinking circular boundary of the game world.
 */
export class Boundary {
    private startTime: number;
    public x: number;
    public y: number;

    /**
     * @constructor
     * @description Initializes the boundary with its starting position and records the game start time.
     */
    constructor() {
        this.startTime = Date.now();
        this.x = WORLD_WIDTH / 2;
        this.y = WORLD_HEIGHT / 2;
    }

    /**
     * @method getRadius
     * @description Calculates the current radius of the shrinking boundary.
     * The radius decreases linearly from INITIAL_BOUNDARY_RADIUS to MIN_BOUNDARY_RADIUS over BOUNDARY_SHRINK_DURATION.
     * After BOUNDARY_SHRINK_DURATION, it halves every 30 seconds.
     * @param {number} currentTime - The current timestamp in milliseconds.
     * @returns {number} The current radius of the boundary.
     */
    public getRadius(currentTime: number): number {
        const elapsedTime = currentTime - this.startTime;

        if (elapsedTime < BOUNDARY_SHRINK_DURATION) {
            // Linear shrinkage
            const shrinkAmount = (INITIAL_BOUNDARY_RADIUS - MIN_BOUNDARY_RADIUS) * (elapsedTime / BOUNDARY_SHRINK_DURATION);
            return INITIAL_BOUNDARY_RADIUS - shrinkAmount;
        } else {
            // Halving every 30 seconds after initial shrink
            const timeAfterInitialShrink = elapsedTime - BOUNDARY_SHRINK_DURATION;
            const thirtySecondIntervals = Math.floor(timeAfterInitialShrink / 30000); // 30000 ms = 30 seconds
            let currentRadius = MIN_BOUNDARY_RADIUS;
            for (let i = 0; i < thirtySecondIntervals; i++) {
                currentRadius /= 2;
            }
            return Math.max(currentRadius, 1); // Ensure radius doesn't become zero or negative
        }
    }
}