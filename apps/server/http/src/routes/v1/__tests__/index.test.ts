import httpStatus from "http-status";
import agent from "../../../test/setup";

describe("API health check", () => {
    it("Should return a 200 OK with a health message from the root endpoint", async () => {
        const response = await agent.get('/')
        expect(response.status).toBe(httpStatus.OK)
        expect(response.text).toBe("API is healthy and running!")
    })
})


describe("Auth route check", ()=>{
    it("It should return unauthorised for protected API endpoints", async()=> {
        const response = await agent.get('/api/v1/auth/me')
        expect(response.status).toBe(httpStatus.UNAUTHORIZED)
        expect(response.body).toEqual({
            success: false,
            message: 'Authentication required'
        })
    })
})


describe("User")