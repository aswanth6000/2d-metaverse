import { useEffect, useRef } from 'react';
import { GRID_HEIGHT, GRID_WIDTH } from '../phaser/constants';
import type { GameState } from '@/types';

type SendFunction = (data: object) => void;

export function usePlayerMovement(gameState: GameState, sendOverSocket: SendFunction) {
    // Use a ref to hold the latest gameState. The ref object itself is stable.
    const gameStateRef = useRef(gameState);
    
    // This effect keeps the ref updated with the latest gameState on every render.
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }
            // Read the LATEST state from the ref's .current property
            const currentGameState = gameStateRef.current;
            if (!currentGameState.self) return;

            let { x, y } = currentGameState.self;
            let moved = false;

            switch (e.key) {
                case "ArrowUp": y--; moved = true; break;
                case "ArrowDown": y++; moved = true; break;
                case "ArrowLeft": x--; moved = true; break;
                case "ArrowRight": x++; moved = true; break;
            }

            if (moved && x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
                sendOverSocket({
                    type: "move",
                    payload: { x, y },
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);

        // This effect should only run ONCE to attach and detach the listener.
        // The listener itself will use the ref to get fresh state.
    }, [sendOverSocket]); // sendOverSocket is stable, so this is effectively once.
}