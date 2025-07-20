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
    food: {
        x: number;
        y: number;
    };
    scores: {
        [key: number]: number;
    };
    boundaryRadius: number;
    sound?: string;
    foodPellets?: {
        x: number;
        y: number;
        type: string;
    }[];
    powerUps?: {
        id: number;
        type: string;
        x: number;
        y: number;
    }[];
}