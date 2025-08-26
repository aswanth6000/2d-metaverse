import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { add } from 'date-fns';
import { ApiError } from '../utils/ApiError';
import { generateTokenAndHash, hashToken } from '../utils/crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import { createSession } from './token.service';
import { prisma } from "@repo/db"

// --- Registration and Verification ---
export const registerUser = async (userData: any) => {
    const { email, name, password } = userData;
    if (await prisma.user.findUnique({ where: { email } })) {
        throw new ApiError(httpStatus.CONFLICT, 'Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, name, passwordHash },
    });
    await sendNewVerificationEmail(user.id, user.email);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const sendNewVerificationEmail = async (userId: string, email: string) => {
    const { token, hash } = generateTokenAndHash();
    const expiresAt = add(new Date(), { hours: 24 });
    await prisma.emailVerification.create({
        data: { userId, tokenHash: hash, expiresAt },
    });
    await sendVerificationEmail(email, token);
};

export const verifyUserEmail = async (token: string) => {
    const tokenHash = hashToken(token);
    const verification = await prisma.emailVerification.findUnique({ where: { tokenHash } });

    if (!verification || verification.expiresAt < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification token');
    }

    await prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
    });

    await prisma.emailVerification.delete({ where: { id: verification.id } });
};

// --- Login and Session Management ---
export const loginUser = async (email: string, pass: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(pass, user.passwordHash))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    if (!user.emailVerified) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Email not verified');
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const refreshAuthTokens = async (refreshToken: string) => {
    const session = await prisma.session.findUnique({ where: { id: refreshToken } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired session');
    }

    // Refresh token rotation
    const newSession = await prisma.session.create({
        data: {
            userId: session.userId,
            expiresAt: add(new Date(), { days: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS!) }),
            ip: session.ip,
            userAgent: session.userAgent,
            replacedById: session.id,
        },
    });

    await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
    });

    return newSession;
};

// --- Password Reset ---
export const requestPasswordReset = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Don't reveal if user exists for security
        return;
    }
    const { token, hash } = generateTokenAndHash();
    const expiresAt = add(new Date(), { minutes: 30 });
    await prisma.passwordReset.create({
        data: { userId: user.id, tokenHash: hash, expiresAt },
    });
    await sendPasswordResetEmail(email, token);
};

export const resetUserPassword = async (token: string, newPass: string) => {
    const tokenHash = hashToken(token);
    const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
    }
    const passwordHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
    });
    await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
    });
    // Invalidate all user sessions for security
    await prisma.session.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

export const destroySession = async (refreshToken: string) => {
    if (!refreshToken) throw new ApiError(httpStatus.NOT_FOUND, "No token provided")
    const deletedSession = await prisma.session.delete({ where: { id: refreshToken } })
    return deletedSession
}