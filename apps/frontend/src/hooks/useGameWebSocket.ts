// src/hooks/useGameWebSocket.ts

import type { GameState, Player } from '@/types';
import { useEffect, useState, useRef } from 'react';

export function useGameWebSocket(spaceId: string) {
    const [gameState, setGameState] = useState<GameState>({ self: null, users: new Map() });
    const socketRef = useRef<WebSocket | null>(null);
    const selfIdRef = useRef<string | null>(null);

    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:8000");
        const ws = socketRef.current;

        ws.onopen = () => {
            console.log("✅ Connected to server");
            const userId = "user-" + Math.floor(Date.now() % 10000);
            selfIdRef.current = userId; // Store our ID in a ref
            ws.send(JSON.stringify({ type: "join", spaceId, userId }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWsMessage(message);
        };

        ws.onclose = () => console.log("Disconnected from server");
        ws.onerror = (error) => console.error("WebSocket Error:", error);

        return () => ws.close();
    }, [spaceId]); // Reconnect if spaceId changes

    const handleWsMessage = (message: any) => {
        setGameState(prev => {
            const newState: GameState = {
                self: prev.self ? { ...prev.self } : null,
                users: new Map(prev.users),
            };

            switch (message.type) {
                case 'space-joined': {
                    newState.self = { ...message.payload.spawn, userId: selfIdRef.current! };
                    message.payload.users.forEach((user: Player) => {
                        if (user.userId !== selfIdRef.current) {
                            newState.users.set(user.userId, user);
                        }
                    });
                    break;
                }
                case 'user-joined': {
                    newState.users.set(message.payload.userId, message.payload);
                    break;
                }
                case 'movement': {
                    const { userId, x, y } = message.payload;
                    if (userId === selfIdRef.current) {
                        if (newState.self) {
                            newState.self.x = x;
                            newState.self.y = y;
                        }
                    } else {
                        const user = newState.users.get(userId);
                        if (user) {
                            newState.users.set(userId, { ...user, x, y });
                        }
                    }
                    break;
                }
                case 'movement-rejected': {
                    if (newState.self) {
                        newState.self.x = message.payload.x;
                        newState.self.y = message.payload.y;
                    }
                    break;
                }
                case 'user-left': {
                    newState.users.delete(message.payload.userId);
                    break;
                }
            }
            return newState;
        });
    };

    const sendOverSocket = (data: object) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        }
    }

    return { gameState, sendOverSocket };
}