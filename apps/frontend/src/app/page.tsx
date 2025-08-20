/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react";


const GRID_CELL_SIZE = 30;
const GRID_WIDTH = 25;
const GRID_HEIGHT = 15;
const CANVAS_WIDTH = GRID_WIDTH * GRID_CELL_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * GRID_CELL_SIZE;


export default function App() {
  const socketRef = useRef<any>(null)
  const [users, setUsers] = useState(new Map());
  const [self, setSelf] = useState({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  console.log(users);

  // Connect to backend
  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000");

    socketRef.current.onopen = () => {
      console.log("✅ Connected to server");

      // join a space
      socketRef.current.send(
        JSON.stringify({
          type: "join",
          spaceId: "lobby-1",
          userId: "user-" + Math.floor(Math.random() * 1000),
        })
      );
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWsMessage(message)
      console.log("📩", message);
    };
    return () => socketRef.current && socketRef.current.close();
  }, []);


  const handleWsMessage = (message: any) => {
    const type = message.type
    switch (type) {
      case 'space-joined':
        setSelf({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
        });
        const userMap = new Map();
        console.log("mesage", message.payload.users);

        message?.payload?.users?.forEach((user: any) => {
          userMap.set(user.userId, user)
        })
        setUsers(userMap)
        break
      case 'user-joined':
        console.log("inside user joined");

        setUsers(prev => {
          const newUsers = new Map(prev)
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId
          })
          return newUsers
        })
        break;
      case 'movement':
        setUsers(prev => {
          const newUsers = new Map(prev)
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
            newUsers.set(message.payload.userId, user)
          }
          return newUsers
        })
        break;
      case 'movement-rejected':
        setSelf((prev) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y
        }))
        break;

      case 'user-left':
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId)
          return newUsers
        })
        break;

    }
  }


  // Draw canvas
  useEffect(() => {
    console.log("render ");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#eee'
    for (let i = 0; i < GRID_WIDTH; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i * GRID_CELL_SIZE, 0)
      ctx.lineTo(i * GRID_CELL_SIZE, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < GRID_HEIGHT; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i * GRID_CELL_SIZE)
      ctx.lineTo(CANVAS_WIDTH, i * GRID_CELL_SIZE)
      ctx.stroke()
    }
    console.log("self", self);


    if (self && typeof self.x === 'number' && typeof self.y === 'number') {
      //center the circle in the grid window 
      const centerX = (self.x * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
      const centerY = (self.y * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);

      console.log("Drawing self at:", self.x * 50, self.y * 50);
      ctx.beginPath()
      ctx.fillStyle = '#ff6b6b'
      ctx.arc(centerX, centerY, GRID_CELL_SIZE / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.font = '14px Arial';
      ctx.textAlign = 'center'
      ctx.fillText('You', centerX, centerY + GRID_CELL_SIZE / 2 + 12)
    }

    users?.forEach((user) => {
      if (!user.x) return
      const centerX = (user.x * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
      const centerY = (user.y * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2);
      ctx.beginPath()
      ctx.fillStyle = '#4ecdc4'
      ctx.arc(centerX, centerY, GRID_CELL_SIZE / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.font = '14px Arial';
      ctx.textAlign = 'center'
      const shortUserId = user.userId.slice(-3);
      ctx.fillText(shortUserId, centerX, centerY + GRID_CELL_SIZE / 2 + 10)
    })
  }, [self, users]);



  // This function now handles the logic and the optimistic update
  const handleMove = (dx: number, dy: number) => {
    // Use the functional form of setState to get the most recent state
    setSelf((prevSelf: { x: number; y: number; }) => {
      if (prevSelf.x === undefined) return prevSelf; // Don't move if not spawned yet

      const newX = prevSelf.x + dx;
      const newY = prevSelf.y + dy;

      // 1. Check boundaries on the client side
      if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
        return prevSelf; // Do nothing if out of bounds
      }

      // 2. Send the move to the server
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: "move",
          payload: { x: newX, y: newY },
        }));
      }
      
      // 3. Optimistically update the state for immediate feedback
      return { ...prevSelf, x: newX, y: newY };
    });
  };


  // This useEffect now sets up the listener just once.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // The logic is now inside handleMove, which prevents stale state.
      switch (e.key) {
        case "ArrowUp":
          handleMove(0, -1);
          break;
        case "ArrowDown":
          handleMove(0, 1);
          break;
        case "ArrowLeft":
          handleMove(-1, 0);
          break;
        case "ArrowRight":
          handleMove(1, 0);
          break;
      }
    };

    window.addEventListener("keydown", handleKey);

    // Cleanup function to remove the listener when the component unmounts
    return () => window.removeEventListener("keydown", handleKey);
  }, []); 

  return (
       <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🕹️ 2D Metaverse</h1>
      
      {/* Canvas container with responsive styling */}
      <div className="border-2 border-gray-300 rounded-lg p-2 bg-gray-50 inline-block">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          className="bg-white border border-gray-200 rounded shadow-sm max-w-full h-auto"
        />
      </div>
      
      {/* Controls info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>Use arrow keys to move around</p>
        <p>Canvas: {GRID_WIDTH} × {GRID_HEIGHT} grid ({CANVAS_WIDTH} × {CANVAS_HEIGHT}px)</p>
        {self.x !== undefined && (
          <p>Your position: ({self.x}, {self.y})</p>
        )}
      </div>
    </div>
  );
}
