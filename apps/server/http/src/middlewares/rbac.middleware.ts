import type{ Response, NextFunction, Request } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError';
import type{ AuthRequest } from './auth.middleware';

export const hasPermission = (requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user || !authReq.user.permissions.includes(requiredPermission)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action.'));
    }
    next();
};
