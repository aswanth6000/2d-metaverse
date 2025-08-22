// src/phaser/GameScene.ts

import type { GameState, Player } from "@/types";
import Phaser from "phaser";
import { PHASER_EVENTS, GRID_CELL_SIZE, CHARACTER_SCALE, GRID_HEIGHT, CANVAS_HEIGHT, CANVAS_WIDTH, GRID_WIDTH } from "./constants";

export class GameScene extends Phaser.Scene {
    private playerSprites: Map<string, Phaser.GameObjects.Container> = new Map();
    private lastPlayerPositions: Map<string, { x: number; y: number }> = new Map();

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.spritesheet("body", "/body.png", { frameWidth: 48, frameHeight: 64 });
        this.load.spritesheet("hair", "/hair.png", { frameWidth: 48, frameHeight: 64 });
        this.load.spritesheet("dress", "/dress.png", { frameWidth: 48, frameHeight: 64 });
    }

    create() {
        this.createGrid();
        this.createAnimations();

        this.game.events.on(PHASER_EVENTS.SYNC_GAME_STATE, this.handleSyncGameState, this);

        this.events.on('shutdown', () => {
            this.game.events.off(PHASER_EVENTS.SYNC_GAME_STATE, this.handleSyncGameState, this);
        });
    }

    private handleSyncGameState(state: GameState): void {
        const { self, users } = state;
        if (!self) return;

        const allPlayers = new Map<string, Player>(users);
        allPlayers.set(self.userId, self);
        const receivedPlayerIds = new Set(allPlayers.keys());

        // Step 1: Add or Update players
        allPlayers.forEach((playerData, userId) => {
            let sprite = this.playerSprites.get(userId);

            // Player does not exist, so create them
            if (!sprite) {
                sprite = this.createCharacter(playerData, userId === self.userId);
                this.playerSprites.set(userId, sprite);
                this.lastPlayerPositions.set(userId, { x: playerData.x, y: playerData.y });
            }
            // Player exists, update them
            else {
                const { x, y } = playerData;
                const lastPos = this.lastPlayerPositions.get(userId);
                let direction = '';

                // Calculate direction BEFORE updating last position
                if (lastPos) {
                    const dx = x - lastPos.x;
                    const dy = y - lastPos.y;
                    if (dx > 0) direction = 'walk-right';
                    else if (dx < 0) direction = 'walk-left';
                    else if (dy > 0) direction = 'walk-down';
                    else if (dy < 0) direction = 'walk-up';
                }

                // Update sprite's visual position and animation
                const newPixelX = (x * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
                const newPixelY = (y * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
                sprite.setPosition(newPixelX, newPixelY);
                this.updateAnimation(sprite, direction);

                // NOW, update the last position for the next frame
                this.lastPlayerPositions.set(userId, { x, y });
            }
        });

        // Step 2: Remove players who have left
        this.playerSprites.forEach((sprite, userId) => {
            if (!receivedPlayerIds.has(userId)) {
                sprite.destroy();
                this.playerSprites.delete(userId);
                this.lastPlayerPositions.delete(userId);
            }
        });
    }

    // This function remains the same
    private updateAnimation(container: Phaser.GameObjects.Container, direction: string): void {
        const parts = ['body', 'hair', 'dress'];
        parts.forEach(partName => {
            const sprite = container.getByName(partName) as Phaser.GameObjects.Sprite;
            if (!sprite) return;

            const currentAnimKey = sprite.anims.currentAnim?.key || '';
            const newAnimKey = direction ? `${direction}-${partName}` : `idle-${partName}`;

            if (currentAnimKey !== newAnimKey) {
                sprite.anims.play(newAnimKey, true);
            }
        });
    }

    private createCharacter(playerData: Player, isSelf: boolean): Phaser.GameObjects.Container {
        const { x, y } = playerData;
        const pixelX = (x * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
        const pixelY = (y * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);

        const body = this.add.sprite(0, 0, 'body').setName('body');
        const dress = this.add.sprite(0, 0, 'dress').setName('dress');
        const hair = this.add.sprite(0, 0, 'hair').setName('hair');

        const nameText = this.add.text(0, 30, isSelf ? 'You' : `Player`, {
            font: '14px Arial',
            color: isSelf ? '#ff6b6b' : '#4ecdc4',
            align: 'center'
        }).setOrigin(0.5);

        const container = this.add.container(pixelX, pixelY, [body, dress, hair, nameText]);
        container.setSize(48, 64);
        container.setScale(CHARACTER_SCALE);

        body.setDepth(0);
        dress.setDepth(1);
        hair.setDepth(2);

        this.updateAnimation(container, ''); // Start in idle animation

        return container;
    }

    createGrid() {
        const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xeeeeee } });
        for (let i = 0; i < GRID_WIDTH; i++) {
            graphics.lineBetween(i * GRID_CELL_SIZE, 0, i * GRID_CELL_SIZE, CANVAS_HEIGHT);
        }
        for (let i = 0; i < GRID_HEIGHT; i++) {
            graphics.lineBetween(0, i * GRID_CELL_SIZE, CANVAS_WIDTH, i * GRID_CELL_SIZE);
        }
    }

    createAnimations() {
        const animsConfig = [
            { key: "walk-down", start: 0, end: 4 },
            { key: "walk-left", start: 5, end: 9 },
            { key: "walk-right", start: 10, end: 14 },
            { key: "walk-up", start: 15, end: 19 },
        ];
        const parts = ['body', 'hair', 'dress'];
        parts.forEach(part => {
            // Idle animation
            this.anims.create({
                key: `idle-${part}`,
                frames: [{ key: part, frame: 0 }],
                frameRate: 1,
                repeat: 0
            });
            // Walking animations
            animsConfig.forEach(anim => {
                this.anims.create({
                    key: `${anim.key}-${part}`,
                    frames: this.anims.generateFrameNumbers(part as string, { start: anim.start, end: anim.end }),
                    frameRate: 8,
                    repeat: -1,
                });
            });
        });
    }
    // createGrid, createAnimations, and createCharacter methods remain mostly the same...
    // ...
}