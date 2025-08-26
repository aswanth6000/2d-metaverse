import type { NextFunction, Request, Response } from "express"
import {  ZodError, ZodObject } from "zod";
import httpStatus from "http-status";
export const validate = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction )=> {
try {
    schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
    });
    next()
} catch (error) {
    if(error instanceof ZodError){
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "validation failed",
            errors: error
        })
    }
}
}