import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as authService from '../service/auth.service';
import { createSession, generateAuthTokens } from '../service/token.service';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { User } from '@repo/db';

console.log("expirationn day", process.env.JWT_REFRESH_EXPIRATION_DAYS!);


const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS!) * 24 * 60 * 60 * 1000,
};

// --- Core Auth ---
export const register = async (req: Request, res: Response) => {
    const user = await authService.registerUser(req.body);
    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, { user }, 'Registration successful. Please check your email to verify your account.'));
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    const { accessToken, refreshToken } = await generateAuthTokens(user.id, req.ip, req.headers['user-agent']);
    createSession(user.id, req.ip, req.headers['user-agent'])
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, { user, accessToken }));
};

export const logout = async (req: Request, res: Response) => {
    const { refreshAuthTokens } = req.cookies
    authService.destroySession(refreshAuthTokens)
    res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'Logged out'));
};

export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    const newSession = await authService.refreshAuthTokens(refreshToken);
    const { accessToken } = await generateAuthTokens(newSession.userId, req.ip, req.headers['user-agent']);
    res.cookie('refreshToken', newSession.id, cookieOptions);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, { accessToken }));
};

export const getMe = (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, authReq.user));
};

// --- OAuth ---
export const googleCallback = async (req: Request, res: Response) => {
    const user = req.user as Omit<User, 'passwordHash'>;
    const { accessToken, refreshToken } = await generateAuthTokens(user.id, req.ip, req.headers['user-agent']);
    res.cookie('refreshToken', refreshToken, cookieOptions);
    // Redirect to frontend which can store the access token
    res.redirect(`${process.env.FRONTEND_URL}/auth-callback?accessToken=${accessToken}`);
};

// --- Email Verification ---
export const requestVerificationEmail = async (req: Request, res: Response) => {
    // This needs a logged-in user to re-request
    const user = (req as AuthRequest).user!;
    await authService.sendNewVerificationEmail(user.id, "user-email-from-db"); // In real app, fetch user email
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'Verification email sent.'));
};

export const verifyEmail = async (req: Request, res: Response) => {
    await authService.verifyUserEmail(req.body.token);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'Email verified successfully.'));
};

// --- Password Reset ---
export const forgotPassword = async (req: Request, res: Response) => {
    await authService.requestPasswordReset(req.body.email);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'If a user with that email exists, a password reset link has been sent.'));
};

export const resetPassword = async (req: Request, res: Response) => {
    await authService.resetUserPassword(req.body.token, req.body.password);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'Password has been reset successfully.'));
};

