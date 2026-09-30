const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const validate = require('../../middleware/validation.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../../middleware/rateLimit.middleware');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('./auth.validation');

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/verify-email', otpLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/resend-otp', otpLimiter, validate({ body: resendOtpSchema }), authController.resendOtp);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/change-password', requireAuth, validate({ body: changePasswordSchema }), authController.changePassword);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
