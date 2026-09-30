const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { generateSecureOTP, hashData, compareHash } = require('../../utils/crypto');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const redis = require('../../config/redis');
const emailService = require('../../services/email/email.service');
const AUTH_CONSTANTS = require('./auth.constants');
const logger = require('../../utils/logger');

const authService = {
  /**
   * Registers a new user account and initiates email OTP verification
   */
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      isEmailVerified: false,
    });

    // Generate secure OTP
    const otp = generateSecureOTP(6);
    const hashedOtp = hashData(otp);

    // Save to Redis
    const redisKey = AUTH_CONSTANTS.REDIS_KEYS.VERIFY_OTP(user._id);
    await redis.set(
      redisKey,
      JSON.stringify({ hashedOtp, attempts: 0 }),
      'EX',
      AUTH_CONSTANTS.OTP_EXPIRY_SECONDS
    );

    // Send verification email
    try {
      await emailService.sendVerificationOTP({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (err) {
      logger.error('Failed to send verification email on register:', { error: err.message });
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    };
  },

  /**
   * Verifies email via OTP
   */
  async verifyEmail({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw ApiError.notFound('User account not found', 'USER_NOT_FOUND');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified', user };
    }

    const redisKey = AUTH_CONSTANTS.REDIS_KEYS.VERIFY_OTP(user._id);
    const otpDataRaw = await redis.get(redisKey);

    if (!otpDataRaw) {
      throw ApiError.badRequest('Verification code has expired or was not requested', 'OTP_EXPIRED');
    }

    const otpData = JSON.parse(otpDataRaw);

    if (otpData.attempts >= AUTH_CONSTANTS.MAX_OTP_ATTEMPTS) {
      await redis.del(redisKey);
      throw ApiError.badRequest('Maximum verification attempts exceeded. Please request a new code.', 'OTP_MAX_ATTEMPTS');
    }

    const isValid = compareHash(otp, otpData.hashedOtp);

    if (!isValid) {
      otpData.attempts += 1;
      await redis.set(redisKey, JSON.stringify(otpData), 'EX', AUTH_CONSTANTS.OTP_EXPIRY_SECONDS);
      throw ApiError.badRequest(
        `Invalid verification code. ${AUTH_CONSTANTS.MAX_OTP_ATTEMPTS - otpData.attempts} attempts remaining.`,
        'INVALID_OTP'
      );
    }

    // Success: Clean up OTP and update user
    await redis.del(redisKey);
    user.isEmailVerified = true;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token in Redis
    await redis.set(
      AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(user._id),
      refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  },

  /**
   * Resends OTP for verification or password reset
   */
  async resendOtp({ email, action = 'verify' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw ApiError.notFound('Account not found', 'USER_NOT_FOUND');
    }

    const cooldownKey = AUTH_CONSTANTS.REDIS_KEYS.RESEND_COOLDOWN(action, user._id);
    const inCooldown = await redis.get(cooldownKey);

    if (inCooldown) {
      throw ApiError.tooManyRequests('Please wait before requesting another code', 'OTP_COOLDOWN');
    }

    const otp = generateSecureOTP(6);
    const hashedOtp = hashData(otp);

    const redisKey =
      action === 'verify'
        ? AUTH_CONSTANTS.REDIS_KEYS.VERIFY_OTP(user._id)
        : AUTH_CONSTANTS.REDIS_KEYS.RESET_OTP(user._id);

    await redis.set(
      redisKey,
      JSON.stringify({ hashedOtp, attempts: 0 }),
      'EX',
      AUTH_CONSTANTS.OTP_EXPIRY_SECONDS
    );

    // Set cooldown
    await redis.set(cooldownKey, 'active', 'EX', AUTH_CONSTANTS.OTP_RESEND_COOLDOWN_SECONDS);

    if (action === 'verify') {
      await emailService.sendVerificationOTP({ email: user.email, name: user.name, otp });
    } else {
      await emailService.sendPasswordResetOTP({ email: user.email, name: user.name, otp });
    }

    return { message: 'Verification code resent successfully' };
  },

  /**
   * Authenticates user and returns tokens
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated', 'ACCOUNT_DEACTIVATED');
    }

    const accessToken = generateAccessToken({ userId: user._id, role: user.role, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store active refresh token in Redis
    await redis.set(
      AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(user._id),
      refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
        targetRole: user.targetRole,
        skills: user.skills,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  },

  /**
   * Logs out the user by revoking tokens and clearing Redis session state
   */
  async logout({ userId, accessToken }) {
    if (userId) {
      await redis.del(AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(userId));
    }

    if (accessToken) {
      // Blacklist access token for remaining lifetime (15 mins)
      await redis.set(
        AUTH_CONSTANTS.REDIS_KEYS.TOKEN_BLACKLIST(accessToken),
        'revoked',
        'EX',
        15 * 60
      );
    }

    return { message: 'Logged out successfully' };
  },

  /**
   * Rotates and refreshes authentication tokens
   */
  async refresh({ refreshToken }) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    const storedToken = await redis.get(AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(decoded.userId));

    if (!storedToken || storedToken !== refreshToken) {
      throw ApiError.unauthorized('Refresh token is revoked or recognized elsewhere', 'TOKEN_REVOKED');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or account inactive', 'USER_NOT_FOUND');
    }

    const newAccessToken = generateAccessToken({ userId: user._id, role: user.role, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    await redis.set(
      AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(user._id),
      newRefreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  },

  /**
   * Initiates forgot password flow
   */
  async forgotPassword({ email }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Prevent account enumeration by always returning generic message
    if (!user) {
      return { message: 'If an account with this email exists, a password reset code has been sent.' };
    }

    const cooldownKey = AUTH_CONSTANTS.REDIS_KEYS.RESEND_COOLDOWN('reset', user._id);
    const inCooldown = await redis.get(cooldownKey);
    if (inCooldown) {
      return { message: 'If an account with this email exists, a password reset code has been sent.' };
    }

    const otp = generateSecureOTP(6);
    const hashedOtp = hashData(otp);

    const redisKey = AUTH_CONSTANTS.REDIS_KEYS.RESET_OTP(user._id);
    await redis.set(
      redisKey,
      JSON.stringify({ hashedOtp, attempts: 0 }),
      'EX',
      AUTH_CONSTANTS.OTP_EXPIRY_SECONDS
    );

    await redis.set(cooldownKey, 'active', 'EX', AUTH_CONSTANTS.OTP_RESEND_COOLDOWN_SECONDS);

    try {
      await emailService.sendPasswordResetOTP({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (err) {
      logger.error('Failed to send password reset email:', { error: err.message });
    }

    return { message: 'If an account with this email exists, a password reset code has been sent.' };
  },

  /**
   * Resets password using valid OTP
   */
  async resetPassword({ email, otp, newPassword }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw ApiError.badRequest('Invalid password reset request', 'INVALID_REQUEST');
    }

    const redisKey = AUTH_CONSTANTS.REDIS_KEYS.RESET_OTP(user._id);
    const otpDataRaw = await redis.get(redisKey);

    if (!otpDataRaw) {
      throw ApiError.badRequest('Reset code has expired or was not requested', 'OTP_EXPIRED');
    }

    const otpData = JSON.parse(otpDataRaw);

    if (otpData.attempts >= AUTH_CONSTANTS.MAX_OTP_ATTEMPTS) {
      await redis.del(redisKey);
      throw ApiError.badRequest('Maximum attempts exceeded. Please request a new code.', 'OTP_MAX_ATTEMPTS');
    }

    const isValid = compareHash(otp, otpData.hashedOtp);

    if (!isValid) {
      otpData.attempts += 1;
      await redis.set(redisKey, JSON.stringify(otpData), 'EX', AUTH_CONSTANTS.OTP_EXPIRY_SECONDS);
      throw ApiError.badRequest('Invalid reset code', 'INVALID_OTP');
    }

    // Success: Update password and remove OTP
    await redis.del(redisKey);
    user.password = newPassword;
    await user.save();

    // Revoke all existing sessions
    await redis.del(AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(user._id));

    // Send security notification
    emailService.sendSecurityNotification({
      email: user.email,
      name: user.name,
      action: 'Password has been successfully reset',
      timestamp: new Date().toUTCString(),
    }).catch(() => {});

    return { message: 'Password has been successfully reset. Please log in with your new password.' };
  },

  /**
   * Changes password for authenticated user
   */
  async changePassword({ userId, currentPassword, newPassword, ip }) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    // Revoke refresh token
    await redis.del(AUTH_CONSTANTS.REDIS_KEYS.REFRESH_TOKEN(user._id));

    emailService.sendSecurityNotification({
      email: user.email,
      name: user.name,
      action: 'Password changed from authenticated session',
      ip,
      timestamp: new Date().toUTCString(),
    }).catch(() => {});

    return { message: 'Password changed successfully. Please log in again.' };
  },
};

module.exports = authService;
