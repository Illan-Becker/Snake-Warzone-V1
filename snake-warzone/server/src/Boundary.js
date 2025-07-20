const { WORLD_WIDTH, WORLD_HEIGHT, INITIAL_BOUNDARY_RADIUS, MIN_BOUNDARY_RADIUS, BOUNDARY_SHRINK_DURATION } = require('../src/shared/Constants.js');

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
module.exports = { ServerBoundary };