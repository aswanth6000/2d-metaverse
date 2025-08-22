// src/phaser/constants.ts

// --- CONFIGURATION ---
export const GRID_CELL_SIZE = 30;
export const GRID_WIDTH = 25;
export const GRID_HEIGHT = 15;
export const CANVAS_WIDTH = GRID_WIDTH * GRID_CELL_SIZE;
export const CANVAS_HEIGHT = GRID_HEIGHT * GRID_CELL_SIZE;
export const CHARACTER_SCALE = 1.25;

// --- EVENT NAMES ---
// This is the key for communication from React to Phaser
export const PHASER_EVENTS = {
    SYNC_GAME_STATE: 'sync-game-state',
};