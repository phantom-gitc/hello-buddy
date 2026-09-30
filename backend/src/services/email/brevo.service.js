const brevoClient = require('../../config/brevo');
const config = require('../../config/env');
const logger = require('../../utils/logger');

const brevoService = {
  /**
   * Sends an email via Brevo transactional API with fallback to logger in dev
   * @param {object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlContent - HTML content of the email
   */
  async sendEmail({ to, subject, htmlContent }) {
    if (!brevoClient || !config.brevo.apiKey || config.brevo.apiKey.includes('dummy')) {
      logger.info(`[MOCK EMAIL / DEV MODE] Email to ${to} | Subject: "${subject}"`);
      return { messageId: 'mock-dev-id-' + Date.now() };
    }

    try {
      const emailPayload = {
        subject,
        htmlContent,
        sender: {
          name: config.brevo.senderName,
          email: config.brevo.senderEmail,
        },
        to: [{ email: to }],
      };

      let response;
      if (brevoClient.transactionalEmails && typeof brevoClient.transactionalEmails.sendTransacEmail === 'function') {
        response = await brevoClient.transactionalEmails.sendTransacEmail(emailPayload);
      } else if (typeof brevoClient.sendTransacEmail === 'function') {
        response = await brevoClient.sendTransacEmail(emailPayload);
      }

      logger.info(`Email successfully dispatched via Brevo to ${to}`, { messageId: response?.messageId || response?.body?.messageId });
      return response;
    } catch (error) {
      logger.error(`Brevo email delivery error: ${error.message}`, {
        error: error.response?.body || error.message,
      });
      throw error;
    }
  },
};

module.exports = brevoService;
