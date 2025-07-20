import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../shared/Constants.js'; // Explicitly import .js
import { Snake } from './Snake';
import { Boundary } from './Boundary';
import { Net } from './Net';
import { Input } from './Input'; // Import Input class
import { AudioManager } from './Audio'; // Import AudioManager class
import type { GameState, PlayerState } from '../shared/Types.js'; // Explicitly import .js

/**
 * @class Game
 * @extends Phaser.Scene
 * @description The main game scene, responsible for managing game logic, updates, and rendering.
 */
export class Game extends Phaser.Scene {
    private playerSnake!: Snake;
    private boundary!: Boundary;
    private boundaryGraphics!: Phaser.GameObjects.Graphics;
    private net!: Net;
    private inputHandler!: Input; // New: Input handler
    private audioManager!: AudioManager; // New: Audio manager
    private otherSnakes: Map<number, Snake> = new Map(); // Store other players' snakes
    private currentGameState: GameState | null = null; // Store the latest game state from the server
    private foodSprite!: Phaser.GameObjects.Rectangle; // New: Food sprite
    private foodPelletGraphics!: Phaser.GameObjects.Graphics; // New: Graphics for food pellets
    private powerUpSprites: Map<number, Phaser.GameObjects.Rectangle> = new Map(); // New: Power-up sprites

    /**
     * @constructor
     */
    constructor() {
        super('Game');
    }

    /**
     * @method preload
     * @description Preloads necessary assets for the game.
     */
    preload() {
        // Preload assets here
        this.load.audio('eat_sound', 'assets/eat.wav');
        this.load.audio('collision_sound', 'assets/collision.wav');
        this.load.image('snake_head', 'assets/snake_head.png');
    }

    /**
     * @method create
     * @description Initializes game objects and systems.
     */
    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Initialize Boundary
        this.boundary = new Boundary();
        this.boundaryGraphics = this.add.graphics();
        this.foodPelletGraphics = this.add.graphics(); // Initialize food pellet graphics

        // Create player snake
        this.playerSnake = new Snake(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 0x00ff00);

        // Make camera follow the player snake
        // Disable camera controls (pinch-to-zoom and pan)
        this.cameras.main.setZoom(1); // Set initial zoom
        this.cameras.main.setScroll(0, 0); // Set initial scroll
        this.cameras.main.setRoundPixels(true); // For pixel art
        this.input.setTopOnly(true); // Prioritize top-most interactive objects

        // Initialize networking
        this.net = new Net(this);

        // Initialize Input handler
        this.inputHandler = new Input(this);
        this.inputHandler.onMove = (angle) => {
            this.playerSnake.update(this.time.now, this.sys.game.loop.delta, angle);
            this.net.sendInput(angle);
        };

        this.inputHandler.onBoost = () => {
            // Implement boost logic here
            console.log('Boost activated!');
            // Send boost event to server: this.net.sendBoost();
        };

        // Initialize Audio Manager
        this.audioManager = new AudioManager(this);
    }

    /**
     * @method update
     * @description Called once per game frame. Contains the main game loop logic.
     * @param {number} time - The current time.
     * @param {number} delta - The delta time since the last frame.
     */
    update(time: number, delta: number) {
        // Update and draw boundary
        const currentRadius = this.boundary.getRadius(time);
        this.boundaryGraphics.clear();
        this.boundaryGraphics.lineStyle(5, 0x00ffff, 1); // Cyan pulsing neon ring
        this.boundaryGraphics.strokeCircle(this.boundary.x, this.boundary.y, currentRadius);

        // Boundary collision detection
        const distanceToBoundaryCenter = Phaser.Math.Distance.Between(this.playerSnake.x, this.playerSnake.y, this.boundary.x, this.boundary.y);

        if (distanceToBoundaryCenter > currentRadius) {
            console.log('Snake hit the boundary!');
            // Future: Implement snake death
        }

        // Camera follow logic
        if (this.currentGameState) { // Only update camera if we have game state
            this.updateCamera(this.currentGameState);
        }
    }

    /**
     * @method handleServerUpdate
     * @description Handles incoming game state updates from the server.
     * @param {GameState} gameState - The latest game state received from the server.
     */
    public handleServerUpdate(gameState: GameState): void {
        this.currentGameState = gameState; // Store the latest game state

        // Update boundary visually
        // The boundary logic is handled by the client-side Boundary class,
        // but we can pass the server's calculated radius if needed for synchronization.
        // For now, the client's boundary calculation is independent but can be synced later.

        // Update players
        const serverPlayerIds = new Set<number>();
        let minX = WORLD_WIDTH, maxX = 0, minY = WORLD_HEIGHT, maxY = 0;
        let alivePlayersCount = 0;

        for (const serverPlayer of gameState.players) {
            serverPlayerIds.add(serverPlayer.id);

            if (serverPlayer.alive) {
                alivePlayersCount++;
                minX = Math.min(minX, serverPlayer.x);
                maxX = Math.max(maxX, serverPlayer.x);
                minY = Math.min(minY, serverPlayer.y);
                maxY = Math.max(maxY, serverPlayer.y);
            }

            if (serverPlayer.id === (this.net as any).playerId) {
                // Update local player's snake
                this.playerSnake.setPosition(serverPlayer.x, serverPlayer.y);
                // We don't update angle here as client controls it
                // We'll update segments later when we have them
            } else {
                // Update other players' snakes
                let otherSnake = this.otherSnakes.get(serverPlayer.id);
                if (!otherSnake) {
                    // Create new snake for other player
                    otherSnake = new Snake(this, serverPlayer.x, serverPlayer.y, parseInt(serverPlayer.color.replace('#', '0x')));
                    this.otherSnakes.set(serverPlayer.id, otherSnake);
                }
                otherSnake.setPosition(serverPlayer.x, serverPlayer.y);
                otherSnake.setRotation(serverPlayer.angle); // Set rotation for other snakes
                otherSnake.alive = serverPlayer.alive; // Update alive status
                // Update segments later
            }
        }

        // Remove disconnected/dead players
        for (const [id, snake] of this.otherSnakes.entries()) {
            if (!serverPlayerIds.has(id) || !this.currentGameState?.players.find((p: PlayerState) => p.id === id)?.alive) {
                snake.destroy();
                this.otherSnakes.delete(id);
            }
        }

        // Update food position
        if (gameState.food) {
            // Need to handle food sprite creation/update
            // For now, let's assume a simple rect
            if (!this.foodSprite) {
                this.foodSprite = this.add.rectangle(gameState.food.x, gameState.food.y, 10, 10, 0xFF0000); // Red food
            } else {
                this.foodSprite.setPosition(gameState.food.x, gameState.food.y);
            }
        }

        // Update food pellets
        if (gameState.foodPellets) {
            // Clear existing food pellets and re-render
            this.foodPelletGraphics.clear();
            this.foodPelletGraphics.fillStyle(0xFFD700, 1); // Gold color for pellets
            for (const pellet of gameState.foodPellets) {
                this.foodPelletGraphics.fillRect(pellet.x, pellet.y, 10, 10);
            }
        }

        // Update power-ups
        // Need to handle power-up sprite creation/update/removal
        if (gameState.powerUps) {
            const serverPowerUpIds = new Set<number>();
            for (const serverPowerUp of gameState.powerUps) {
                serverPowerUpIds.add(serverPowerUp.id);
                let clientPowerUp = this.powerUpSprites.get(serverPowerUp.id);
                if (!clientPowerUp) {
                    clientPowerUp = this.add.rectangle(serverPowerUp.x, serverPowerUp.y, 20, 20, 0x00FF00); // Green power-up
                    this.powerUpSprites.set(serverPowerUp.id, clientPowerUp);
                } else {
                    clientPowerUp.setPosition(serverPowerUp.x, serverPowerUp.y);
                }
            }
            // Remove old power-ups
            for (const [id, sprite] of this.powerUpSprites.entries()) {
                if (!serverPowerUpIds.has(id)) {
                    sprite.destroy();
                    this.powerUpSprites.delete(id);
                }
            }
        }

        // Play sounds based on server state (if server sends sound events)
        if (gameState.sound === 'eat') { // Assuming server sends 'sound' property in gameState
            this.audioManager.playEatSound();
        } else if (gameState.sound === 'collision') {
            this.audioManager.playCollisionSound();
        }
    }

    /**
     * @method updateCamera
     * @description Adjusts the camera to follow all living snakes and maintains appropriate zoom.
     * @param {GameState} gameState - The current game state.
     */
    private updateCamera(gameState: GameState): void {
        let minX = WORLD_WIDTH, maxX = 0, minY = WORLD_HEIGHT, maxY = 0;
        let alivePlayersCount = 0;

        // Include playerSnake in camera calculation only if alive
        if (this.playerSnake.alive) { // Assuming Snake class has an 'alive' property
            alivePlayersCount++;
            minX = Math.min(minX, this.playerSnake.x);
            maxX = Math.max(maxX, this.playerSnake.x);
            minY = Math.min(minY, this.playerSnake.y);
            maxY = Math.max(maxY, this.playerSnake.y);
        }

        for (const serverPlayer of gameState.players) {
            if (serverPlayer.alive && serverPlayer.id !== (this.net as any).playerId) {
                alivePlayersCount++;
                minX = Math.min(minX, serverPlayer.x);
                maxX = Math.max(maxX, serverPlayer.x);
                minY = Math.min(minY, serverPlayer.y);
                maxY = Math.max(maxY, serverPlayer.y);
            }
        }

        if (alivePlayersCount === 0) {
            // No alive players, maybe zoom out to show whole world or stop camera
            this.cameras.main.setZoom(1);
            this.cameras.main.centerToBounds();
            return;
        }

        const padding = 100; // Padding around the group of snakes
        const targetWidth = (maxX - minX) + padding * 2;
        const targetHeight = (maxY - minY) + padding * 2;

        const cameraWidth = this.cameras.main.width;
        const cameraHeight = this.cameras.main.height;

        const zoomX = cameraWidth / targetWidth;
        const zoomY = cameraHeight / targetHeight;
        let newZoom = Math.min(zoomX, zoomY, 1); // Max zoom of 1 (no zoom-in beyond screen size)

        // Smooth zoom transition
        this.cameras.main.zoomTo(newZoom, 500, 'Sine.easeInOut'); // 500ms duration

        // Center camera on the bounding box
        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;
        this.cameras.main.pan(centerX, centerY, 500, 'Sine.easeInOut'); // 500ms duration
    }
}