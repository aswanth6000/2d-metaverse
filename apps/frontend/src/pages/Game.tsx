/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

// --- CONFIGURATION ---
const GRID_CELL_SIZE = 30;
const GRID_WIDTH = 25;
const GRID_HEIGHT = 15;
const CANVAS_WIDTH = GRID_WIDTH * GRID_CELL_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * GRID_CELL_SIZE;
const CHARACTER_SCALE = 1.25; // Adjust the character size

// --- PHASER SCENE ---
// This class handles all the rendering and animation inside the canvas
class GameScene extends Phaser.Scene {
    private playerSprites: Map<string, Phaser.GameObjects.Container>;
    private lastPlayerPositions: Map<string, { x: number; y: number }>;

    constructor() {
        super({ key: 'GameScene' });
        this.playerSprites = new Map();
        this.lastPlayerPositions = new Map();
    }

    preload() {
        // Load the same assets from your previous animation example
        this.load.spritesheet("body", "/body.png", { frameWidth: 48, frameHeight: 64 });
        this.load.spritesheet("hair", "/hair.png", { frameWidth: 48, frameHeight: 64 });
        this.load.spritesheet("dress", "/dress.png", { frameWidth: 48, frameHeight: 64 });
    }

    create() {
        this.createGrid();
        this.createAnimations();

        // Listen for player update events from the React component
        this.game.events.on('updatePlayers', this.handlePlayerUpdates, this);

        // Clean up listener when the scene shuts down
        this.events.on('shutdown', () => {
            this.game.events.off('updatePlayers', this.handlePlayerUpdates, this);
        });
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

    handlePlayerUpdates(data: { users: Map<string, any>, self: any }) {
        const { users, self } = data;
        const allPlayers = new Map(users);
        if (self.userId) {
            allPlayers.set(self.userId, self);
        }

        const receivedPlayerIds = new Set(allPlayers.keys());

        // Update existing players and add new ones
        allPlayers.forEach((playerData, userId) => {
            const { x, y } = playerData;
            const newPixelX = (x * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
            const newPixelY = (y * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);

            let playerContainer = this.playerSprites.get(userId);

            if (!playerContainer) {
                // Player doesn't exist, create them
                playerContainer = this.createCharacter(newPixelX, newPixelY, userId === self.userId);
                this.playerSprites.set(userId, playerContainer);
                this.lastPlayerPositions.set(userId, { x, y });
            } else {
                // Player exists, update position and animation
                playerContainer.x = newPixelX;
                playerContainer.y = newPixelY;

                const lastPos = this.lastPlayerPositions.get(userId) || { x, y };
                const dx = x - lastPos.x;
                const dy = y - lastPos.y;

                let direction = '';
                if (dx > 0) direction = 'walk-right';
                else if (dx < 0) direction = 'walk-left';
                else if (dy > 0) direction = 'walk-down';
                else if (dy < 0) direction = 'walk-up';

                // Inside handlePlayerUpdates, replace the logic after calculating 'direction'

                const body = playerContainer.getByName('body') as Phaser.GameObjects.Sprite;
                const hair = playerContainer.getByName('hair') as Phaser.GameObjects.Sprite;
                const dress = playerContainer.getByName('dress') as Phaser.GameObjects.Sprite;
                    
                if (direction) {
                    // There is movement, so play the corresponding walk animation.
                    body.anims.play(`${direction}-body`, true);
                    hair.anims.play(`${direction}-hair`, true);
                    dress.anims.play(`${direction}-dress`, true);
                } else {
                    // There is NO movement.
                    // Play the idle animation, but only if we aren't already playing it.
                    if (body.anims.currentAnim?.key !== 'idle-body') {
                        body.anims.play('idle-body', true);
                        hair.anims.play('idle-hair', true);
                        dress.anims.play('idle-dress', true);
                    }
                }

                this.lastPlayerPositions.set(userId, { x, y });
            }
        });

        // Remove players who have left
        this.playerSprites.forEach((sprite, userId) => {
            if (!receivedPlayerIds.has(userId)) {
                sprite.destroy();
                this.playerSprites.delete(userId);
                this.lastPlayerPositions.delete(userId);
            }
        });
    }

    createCharacter(x: number, y: number, isSelf: boolean) {
        // Create each part of the character
        const body = this.add.sprite(0, 0, 'body').setName('body');
        const dress = this.add.sprite(0, 0, 'dress').setName('dress');
        const hair = this.add.sprite(0, 0, 'hair').setName('hair');

        // Add a name tag
        const nameText = this.add.text(0, 30, isSelf ? 'You' : 'Player', {
            font: '14px Arial',
            color: isSelf ? '#ff6b6b' : '#4ecdc4',
            align: 'center'
        }).setOrigin(0.5);

        // Use a Container to group all parts. This makes them easy to move together.
        const container = this.add.container(x, y, [body, dress, hair, nameText]);
        container.setSize(48, 64); // Important for interaction if you add it later
        container.setScale(CHARACTER_SCALE);

        // Set render depth
        body.setDepth(0);
        dress.setDepth(1);
        hair.setDepth(2);

        // Start in idle animation
        body.anims.play('idle-body');
        hair.anims.play('idle-hair');
        dress.anims.play('idle-dress');

        return container;
    }
}


// --- REACT COMPONENT ---
export default function Game() {
    const socketRef = useRef<any>(null);
    const phaserGameRef = useRef<Phaser.Game | null>(null);

    // We only need state for the raw data from the server
    const [users, setUsers] = useState(new Map());
    const [self, setSelf] = useState<any>({});

    // Effect for WebSocket connection
    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:8000");
        const ws = socketRef.current;

        ws.onopen = () => {
            console.log("✅ Connected to server");
            // Create a semi-unique userId
            const userId = "user-" + Math.floor(Date.now() % 10000);
            setSelf({ userId }); // Store our own userId
            ws.send(JSON.stringify({ type: "join", spaceId: "lobby-1", userId }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWsMessage(message);
        };

        return () => ws.close();
    }, []);

    // Effect for initializing and destroying Phaser
    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            parent: "phaser-container",
            backgroundColor: '#ffffff',
            scene: [GameScene]
        };

        // Only create the game if it doesn't exist
        if (!phaserGameRef.current) {
            phaserGameRef.current = new Phaser.Game(config);
        }

        // Cleanup on component unmount
        return () => {
            phaserGameRef.current?.destroy(true);
            phaserGameRef.current = null;
        };
    }, []);

    // Effect to send data to Phaser when state changes
    useEffect(() => {
        if (phaserGameRef.current) {
            // Use the event emitter to pass fresh data to the scene
            phaserGameRef.current.events.emit('updatePlayers', { users, self });
        }
    }, [users, self]);

    const handleWsMessage = (message: any) => {
        const type = message.type;
        const userMap = new Map();
        switch (type) {
            case 'space-joined':
                setSelf((prev: any) => ({
                    ...prev,
                    x: message.payload.spawn.x,
                    y: message.payload.spawn.y,
                }));
                message.payload.users.forEach((user: any) => {
                    if (user.userId !== self.userId) { // Don't add self to the other users map
                        userMap.set(user.userId, user);
                    }
                });
                setUsers(userMap);
                break;
            case 'user-joined':
                setUsers(prev => new Map(prev).set(message.payload.userId, {
                    x: message.payload.x,
                    y: message.payload.y,
                    userId: message.payload.userId
                }));
                break;
            case 'movement':
                if (message.payload.userId === self.userId) {
                    // This is our own movement confirmation, update self
                    setSelf((prev: any) => ({
                        ...prev,
                        x: message.payload.x,
                        y: message.payload.y
                    }));
                } else {
                    // This is another user's movement
                    setUsers(prev => {
                        const newUsers = new Map(prev);
                        const user = newUsers.get(message.payload.userId);
                        if (user) {
                            user.x = message.payload.x;
                            user.y = message.payload.y;
                            newUsers.set(message.payload.userId, user);
                        }
                        return newUsers;
                    });
                }
                break;
            case 'movement-rejected':
                setSelf((prev) => ({ ...prev, x: message.payload.x, y: message.payload.y }));
                break;
            case 'user-left':
                setUsers(prev => {
                    const newUsers = new Map(prev);
                    newUsers.delete(message.payload.userId);
                    return newUsers;
                });
                break;
        }
    }

    const handleMove = (dx: number, dy: number) => {
        setSelf((prevSelf: { x: number; y: number; }) => {
            if (prevSelf.x === undefined) return prevSelf;
            const newX = prevSelf.x + dx;
            const newY = prevSelf.y + dy;
            if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
                return prevSelf;
            }
            if (socketRef.current) {
                socketRef.current.send(JSON.stringify({
                    type: "move",
                    payload: { x: newX, y: newY },
                }));
            }
            // Optimistic update
            return { ...prevSelf, x: newX, y: newY };
        });
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowUp": handleMove(0, -1); break;
                case "ArrowDown": handleMove(0, 1); break;
                case "ArrowLeft": handleMove(-1, 0); break;
                case "ArrowRight": handleMove(1, 0); break;
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []); // Empty dependency array ensures this runs only once

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">🕹️ Animated Metaverse</h1>

            {/* This div is where Phaser will create its canvas */}
            <div id="phaser-container" className="border-2 border-gray-300 rounded-lg shadow-lg" />

            <div className="mt-4 text-sm text-gray-600">
                <p>Use arrow keys to move your character</p>
                {self.x !== undefined && (
                    <p>Your position: ({self.x}, {self.y})</p>
                )}
            </div>
        </div>
    );
}