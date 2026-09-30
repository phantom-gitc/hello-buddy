const brevo = require('@getbrevo/brevo');
const config = require('./env');
const logger = require('../utils/logger');

let brevoClient;

try {
  if (config.brevo.apiKey && !config.brevo.apiKey.includes('dummy')) {
    if (brevo.BrevoClient) {
      brevoClient = new brevo.BrevoClient({ apiKey: config.brevo.apiKey });
    } else if (brevo.TransactionalEmailsApi) {
      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);
      brevoClient = apiInstance;
    }
    logger.email('Transactional email ready');
  } else {
    logger.warn('Brevo API key not provided or dummy. Emails will log to console in development mode.');
  }
} catch (error) {
  logger.warn(`Brevo initialization warning: ${error.message}`);
}

module.exports = brevoClient;
