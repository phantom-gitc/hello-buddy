const brevoService = require('./brevo.service');
const { getVerificationTemplate } = require('./templates/verification.template');
const { getResetPasswordTemplate } = require('./templates/reset-password.template');
const { getSecurityNotificationTemplate } = require('./templates/security.template');

const emailService = {
  /**
   * Sends OTP for email verification
   */
  async sendVerificationOTP({ email, name, otp }) {
    logger.info(`🔑 [DEV-OTP] Verification code for ${email} is: ${otp}`);
    const htmlContent = getVerificationTemplate({ name, otp });
    return brevoService.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - HelloBuddy AI',
      htmlContent,
    });
  },

  /**
   * Sends OTP for password reset
   */
  async sendPasswordResetOTP({ email, name, otp }) {
    logger.info(`🔑 [DEV-OTP] Password reset code for ${email} is: ${otp}`);
    const htmlContent = getResetPasswordTemplate({ name, otp });
    return brevoService.sendEmail({
      to: email,
      subject: 'Reset Your Password - HelloBuddy AI',
      htmlContent,
    });
  },

  /**
   * Sends security notification email
   */
  async sendSecurityNotification({ email, name, action, ip, timestamp }) {
    const htmlContent = getSecurityNotificationTemplate({ name, action, ip, timestamp });
    return brevoService.sendEmail({
      to: email,
      subject: 'Security Alert: Account Activity - HelloBuddy AI',
      htmlContent,
    });
  },
};

module.exports = emailService;
