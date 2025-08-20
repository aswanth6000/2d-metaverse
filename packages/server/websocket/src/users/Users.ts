import type { WebSocket } from "ws";
import { RoomManager } from "../rooms/manager";



function getRandomString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export class User {
    public id: string;
    public userId?: string;
    public spaceId?: string;
    public x: number;
    public y: number;
    public ws: WebSocket


    constructor(ws: WebSocket) {
        this.id = getRandomString(10)
        this.x = 0
        this.y = 0
        this.ws = ws
        this.initHandlers()
    }
    initHandlers() {
        this.ws.on('message', async (data) => {
            const parsedData = JSON.parse(data.toString())
            console.log(parsedData);
            

            const type = parsedData.type
            switch (type) {
                case 'join':
                    console.log("join event recievedd");
                    const spaceId = parsedData.spaceId
                    const userId = parsedData.userId // secure using jwt
                    if (!userId) {
                        this.ws.close()
                        return
                    }

                    this.userId = userId

                    const space = {
                        spaceId: "lobby-1",
                        width: 25,
                        name: "defalut",
                        height: 15
                    }

                    this.spaceId = spaceId
                    RoomManager.getInstance().addUser(spaceId, this)
                    this.x = Math.floor(Math.random() * space?.width)
                    this.y = Math.floor(Math.random() * space?.height)
                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: { x: this.x, y: this.y },
                            users: RoomManager.getInstance().rooms.get(spaceId)
                                ?.filter(x => x.id !== this.id)
                                ?.map((u) => ({ userId: u.userId, x: u.x, y: u.y })) ?? []
                        }
                    });

                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.userId,
                            x: this.x,
                            y: this.y
                        }

                    }, this, this.spaceId!);
                    break;
                case 'move':
                    const moveX = parsedData.payload.x
                    const moveY = parsedData.payload.y
                    const Xdisplacement = Math.abs(this.x - moveX)
                    const Ydisplacement = Math.abs(this.y - moveY)

                    if ((Xdisplacement == 1 && Ydisplacement == 0) || (Xdisplacement == 0 && Ydisplacement == 1)) {
                        this.x = moveX
                        this.y = moveY
                        RoomManager.getInstance().broadcast({
                            type: "movement",
                            payload: {
                                userId: this.userId,
                                x: this.x,
                                y: this.y
                            }
                        }, this, this.spaceId!)
                        return
                    }
                    this.send({
                        type: 'movement-rejected',
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    })

            }

        })
    }
    destroy() {
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }, this, this.spaceId!)
        RoomManager.getInstance().removeUser(this, this.spaceId!)
    }
    send(payload: any) { //ts - fix
        this.ws.send(JSON.stringify(payload))
    }

}