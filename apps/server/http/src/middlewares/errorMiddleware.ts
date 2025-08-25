import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import httpStatus from "http-status";

export const errorHandler = (error: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
    let statusCode = httpStatus.INTERNAL_SERVER_ERROR as number
    let message = "An unexpected error occoured"

    if (error instanceof ApiError) {
        statusCode = error.statusCode
        message = error.message
    } else {
        console.error(error);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    })
}