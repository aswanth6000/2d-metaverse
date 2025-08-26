import httpStatus from "http-status";
import agent from "../../../test/setup";
import { prisma } from "@repo/db"
import bcrypt from 'bcryptjs'

describe("API health check", () => {
    it("Should return a 200 OK with a health message from the root endpoint", async () => {
        const response = await agent.get('/')
        expect(response.status).toBe(httpStatus.OK)
        expect(response.text).toBe("API is healthy and running!")
    })
})


describe("Auth route check", () => {
    it("It should return unauthorised for protected API endpoints", async () => {
        const response = await agent.get('/api/v1/auth/me')
        expect(response.status).toBe(httpStatus.UNAUTHORIZED)
        expect(response.body).toEqual({
            success: false,
            message: 'Authentication required'
        })
    })
})


describe("Auth: Registration", () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
        await prisma.session.deleteMany()
    })
    it("Should register a new user successfully", async () => {
        const newUser = {
            email: "test@example.com",
            password: "Password123!",
            name: "Test User",
        };
        const response = await agent.post('/api/v1/auth/register').send(newUser)
        expect(response.status).toBe(httpStatus.CREATED)
        expect(response.body).toMatchObject({
            message: 'Registration successful. Please check your email to verify your account.',
            success: true,
        })
        expect(response.body.data.user).toHaveProperty("id")
        expect(response.body.data.user.email).toBe(newUser.email)
    })
    it("Should not allow duplicate emails", async () => {
        const user = {
            email: "duplicate@example.com",
            password: "Password123!",
            name: "Dup User",
        };
        await agent.post('/api/v1/auth/register').send(user)
        const response = await agent.post('/api/v1/auth/register').send(user)
        expect(response.status).toBe(httpStatus.CONFLICT)
        expect(response.body.message).toBe('Email already registered')
    })
})



describe("Auth: Login", () => {
    const testUser = {
        email: "loginuser@example.com",
        password: "Password123!",
        name: "Login User",
    };
    const testUserNotVerified = {
        email: "loginusernotverified@example.com",
        password: "Password123!",
        name: "Login Not verified User",
    };

    beforeEach(async () => {
        await prisma.user.deleteMany()
        const hashedPassword = await bcrypt.hash(testUser.password, 10)
        await prisma.user.create({
            data: {
                email: testUser.email,
                name: testUser.name,
                passwordHash: hashedPassword,
                emailVerified: true
            }
        })
        await prisma.user.create({
            data: {
                email: testUserNotVerified.email,
                name: testUserNotVerified.name,
                passwordHash: hashedPassword,
                emailVerified: false
            }
        })
    })
    afterAll(async () => {
        await prisma.$disconnect()
    })
    it("Should login the user with valid credintials", async () => {
        const response = await agent.post("/api/v1/auth/login").send({ email: testUser.email, password: testUser.password }).set("User-Agent", "SuperTest")
            .set("X-Forwarded-For", "127.0.0.1");
        expect(response.body.data).toHaveProperty("user");
        expect(response.status).toBe(httpStatus.OK)
        expect(response.body.data.user.email).toBe(testUser.email)
        expect(response.body.data).toHaveProperty("accessToken");

    })
    it("should throw UNAUTHORIZED when user tries to login with incorrect passoword", async () => {
        const response = await agent.post("/api/v1/auth/login").send({ email: testUser.email, password: "wrongpassword" }).set("User-Agent", "SuperTest")
            .set("X-Forwarded-For", "127.0.0.1");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED)
        expect(response.body.message).toBe("Incorrect email or password")
    })
    it("Should fail when user does not exists", async () => {
        const response = await agent.post("/api/v1/auth/login").send({ email: "random@email.com", password: "wrongpassword" }).set("User-Agent", "SuperTest")
            .set("X-Forwarded-For", "127.0.0.1");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED)
        expect(response.body.message).toBe("Incorrect email or password")
    })
    it("Should fail when email is not verified", async () => {
        const response = await agent.post("/api/v1/auth/login").send({ email: testUserNotVerified.email, password: testUserNotVerified.password }).set("User-Agent", "SuperTest")
            .set("X-Forwarded-For", "127.0.0.1");

        expect(response.status).toBe(httpStatus.FORBIDDEN)
        expect(response.body.message).toBe('Email not verified')
    })
})