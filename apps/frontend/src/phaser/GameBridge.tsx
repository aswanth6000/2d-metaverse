// src/phaser/GameBridge.ts

import Phaser from 'phaser';
import { PHASER_EVENTS } from './constants';
import type { SyncGameStatePayload } from '@/types';

class GameBridge {
    private game: Phaser.Game | null = null;
    private eventEmitter: Phaser.Events.EventEmitter | null = null;

    // Called by React's useEffect to initialize Phaser
    public init(config: Phaser.Types.Core.GameConfig): Phaser.Game {
        if (this.game) {
            return this.game;
        }
        this.game = new Phaser.Game(config);
        this.eventEmitter = this.game.events;
        return this.game;
    }

    // Called by React's cleanup effect to destroy the game
    public destroy(): void {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
            this.eventEmitter = null;
        }
    }

    // React components use this to send data to the Phaser scene
    public emitSyncGameState(payload: SyncGameStatePayload): void {
        if (!this.eventEmitter) {
            console.warn('Phaser event emitter is not available.');
            return;
        }
        this.eventEmitter.emit(PHASER_EVENTS.SYNC_GAME_STATE, payload);
    }
}

// Export a singleton instance so the whole app uses the same bridge
export const gameBridge = new GameBridge();