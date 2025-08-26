import jwt from 'jsonwebtoken'
import { add } from 'date-fns'
import { prisma, Session } from "@repo/db"

const expirationMunutes = process.env.JWT_ACCESS_EXPIRATION_MINUTES!

export const generateAccessToken = (userId: string) => {
    const payload = { sub: userId }
    const expiresIn = `${expirationMunutes}m`
    return jwt
}


export const createSession = async (userId: string, ip?: string, userAgent?: string): Promise<Session> => {
    const expiresAt = add(new Date(), { days: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS!) });
    return prisma.session.create({
        data: { userId, expiresAt, ip, userAgent },
    });
};

export const generateAuthTokens = async (userId: string, ip?: string, userAgent?: string) => {
    const accessToken = generateAccessToken(userId);
    const session = await createSession(userId, ip, userAgent);
    return {
        accessToken,
        refreshToken: session.id, // The session ID is our refresh token
    };
};