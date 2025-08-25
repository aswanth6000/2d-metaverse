import express, { type NextFunction, type Request, type Response } from "express"
import 'express-async-errors'
import {} from "@repo/db"
import { ApiError } from "./utils/ApiError"
import httpStatus from "http-status"


const app = express()
const PORT = process.env.HTTP_PORT! || 8001



app.use((req: Request, res: Response, next: NextFunction)=> {
    next(new ApiError(httpStatus.NOT_FOUND, "Not found"))
})

app.listen(PORT, ()=> {
    console.log(`Server listening on PORT: ${PORT}`);
})