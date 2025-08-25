
export class ApiError extends Error {
    public statusCode: number
    public isOperational: boolean

    constructor(statusCode: number, messsage: string, isOperational: boolean = true, stack= '') {
        super(messsage)
        this.statusCode = statusCode
        this.isOperational = isOperational
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}