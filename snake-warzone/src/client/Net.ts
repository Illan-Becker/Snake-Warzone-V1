import { Game } from './Game';

/**
 * @class Net
 * @description Handles WebSocket communication with the game server.
 */
export class Net {
    private ws: WebSocket;
    private gameScene: Game;
    private playerId: number | null = null;

    /**
     * @constructor
     * @param {Game} gameScene - The game scene instance to interact with.
     */
    constructor(gameScene: Game) {
        this.gameScene = gameScene;
        this.ws = new WebSocket('ws://localhost:3000'); // Connect to our server

        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data as string);
            switch (message.type) {
                case 'init':
                    this.playerId = message.playerId;
                    console.log(`Received init message. Player ID: ${this.playerId}`);
                    // Handle initial game state (e.g., populate players, food)
                    // For now, we'll just log
                    break;
                case 'update':
                    // Update game state based on server message
                    // For now, we'll just log
                    // console.log('Received game state update:', message.data);
                    this.gameScene.handleServerUpdate(message.data);
                    break;
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    /**
     * @method sendInput
     * @description Sends player input (angle) to the server.
     * @param {number} angle - The angle of the player's snake.
     */
    public sendInput(angle: number): void {
        if (this.ws.readyState === WebSocket.OPEN && this.playerId !== null) {
            this.ws.send(JSON.stringify({ type: 'move', playerId: this.playerId, angle }));
        }
    }
}