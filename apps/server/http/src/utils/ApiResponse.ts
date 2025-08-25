export class ApiResponse<T>{
    public statusCode: number
    public data: T
    public message: string
    public success: boolean

    constructor(statusCode: number, message: string, data: T){
        this.statusCode = statusCode,
        this.message = message,
        this.data = data,
        this.success = true
    }
}