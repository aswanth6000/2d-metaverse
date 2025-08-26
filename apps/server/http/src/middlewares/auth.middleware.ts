import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError';
import { prisma } from "@repo/db"
export interface AuthRequest extends Request {
    user?: {
        id: string;
        roles: string[];
        permissions: string[];
    };
}

export const protect: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    const authHeader = authReq.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1] || '';
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: {
                roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            },
        });

        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
        }

        const roles = user.roles.map(userRole => userRole.role.name);
        const permissions = user.roles.flatMap(userRole =>
            userRole.role.permissions.map(rolePerm => rolePerm.permission.key)
        );

        req.user = {
            id: user.id,
            roles,
            permissions: [...new Set(permissions)], // Ensure unique permissions
        };
        next();
    } catch (error) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
    }
};
