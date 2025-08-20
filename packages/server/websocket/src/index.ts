import webSocket, { WebSocketServer } from 'ws'
import { User } from './users/Users';


const ws = new WebSocketServer({ port: 8000 });
ws.on('connection', (ws) => {
    console.log("\x1b[32m%s\x1b[0m", "✅ User connected"); 
    new User(ws)
    ws.on('error', console.error)
    ws.on('close', () => {

        console.log("\x1b[31m%s\x1b[0m", "❌ User disconnected");
    })
})
