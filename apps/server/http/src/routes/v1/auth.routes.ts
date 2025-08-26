import { Router } from 'express';
import passport from 'passport';
import * as authController from '../../controllers/auth.controller';
import { validate } from '../../middlewares/validateRequest';
import * as authValidation from '../../validations/auth.validations';
import { protect } from '../../middlewares/auth.middleware';
import { hasPermission } from '../../middlewares/rbac.middleware';

const router = Router();

// --- Core Auth & Session ---
router.post('/register', validate(authValidation.registerSchema), authController.register);
router.post('/login', validate(authValidation.loginRequestSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// --- Email & Password Management ---
router.post('/verify-email', validate(authValidation.verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', validate(authValidation.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);

// --- OAuth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

// --- Protected Routes ---
router.get('/me', protect, authController.getMe);
// Example of an RBAC-protected route
router.get('/admin-data', protect, hasPermission('user.create'), (req, res) => {
    res.json({ message: 'You have permission to create users!' });
});

export default router;