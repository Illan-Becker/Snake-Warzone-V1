import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/Constants';

/**
 * @class Snake
 * @extends Phaser.GameObjects.Sprite
 * @description Represents a snake in the game, handling its visual representation and movement.
 */
export class Snake extends Phaser.GameObjects.Sprite {
    private speed: number = 200; // Pixels per second
    private currentAngle: number = 0; // Current angle in radians
    public alive: boolean = true; // Add alive property

    /**
     * @constructor
     * @param {Phaser.Scene} scene - The Phaser Scene this snake belongs to.
     * @param {number} x - The initial X position of the snake.
     * @param {number} y - The initial Y position of the snake.
     * @param {number} color - The tint color of the snake sprite.
     */
    constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
        super(scene, x, y, 'snake_head'); // Use 'snake_head' image
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.5); // Set origin to center of the sprite
        this.setTint(color); // Apply tint for snake color

        // Cast to any to access body property
        (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
        (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    }

    /**
     * @method update
     * @description Updates the snake's position and rotation based on the given angle.
     * @param {number} time - The current time.
     * @param {number} delta - The delta time since the last frame.
     * @param {number} angle - The target angle for the snake in radians.
     */
    update(_time: number, _delta: number, angle: number) {
        this.currentAngle = angle;

        // Calculate velocity based on angle
        const vx = Math.cos(this.currentAngle) * this.speed;
        const vy = Math.sin(this.currentAngle) * this.speed;

        // Set velocity of the physics body
        (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

        // Apply toroidal wrapping
        this.x = (this.x + WORLD_WIDTH) % WORLD_WIDTH;
        this.y = (this.y + WORLD_HEIGHT) % WORLD_HEIGHT;

        this.setRotation(this.currentAngle); // Set sprite rotation to match movement angle
    }
}