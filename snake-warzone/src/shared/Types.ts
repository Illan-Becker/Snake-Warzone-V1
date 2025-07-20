export interface SnakeSegment {
    x: number;
    y: number;
}

export interface PlayerState {
    id: number;
    x: number;
    y: number;
    segments: SnakeSegment[];
    angle: number;
    alive: boolean;
    color: string;
}

export interface GameState {
    players: PlayerState[];
    food: { x: number, y: number };
    scores: { [key: number]: number };
    boundaryRadius: number;
    // Add other properties that will be sent from the server
    sound?: string; // Optional sound event from server
    foodPellets?: { x: number, y: number, type: string }[]; // Optional food pellets from server
    powerUps?: { id: number, type: string, x: number, y: number }[]; // Optional power-ups from server
}