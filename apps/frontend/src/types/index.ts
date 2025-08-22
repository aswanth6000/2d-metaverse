// src/types/index.ts

export interface Player {
    userId: string;
    x: number;
    y: number;
    // You can add more properties here later, like appearance, name, etc.
}

export interface GameState {
    self: Player | null;
    users: Map<string, Player>;
}

// Define the payload for the event we'll emit to Phaser
export type SyncGameStatePayload = GameState;