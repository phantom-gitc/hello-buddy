const AUTH_CONSTANTS = {
  OTP_EXPIRY_SECONDS: 10 * 60, // 10 minutes
  OTP_RESEND_COOLDOWN_SECONDS: 60, // 1 minute
  MAX_OTP_ATTEMPTS: 5,

  REDIS_KEYS: {
    VERIFY_OTP: (userId) => `otp:verify:${userId}`,
    RESET_OTP: (userId) => `otp:reset:${userId}`,
    RESEND_COOLDOWN: (action, userId) => `cooldown:${action}:${userId}`,
    TOKEN_BLACKLIST: (token) => `blacklist:${token}`,
    REFRESH_TOKEN: (userId) => `refreshtoken:${userId}`,
  },
};

module.exports = AUTH_CONSTANTS;
