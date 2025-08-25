import express from "express"
const PORT = process.env.HTTP_PORT! || 8001
import {} from "@repo/db"
const app = express()



app.listen(PORT, ()=> {
    console.log(`Server listening on PORT: ${PORT}`);
})