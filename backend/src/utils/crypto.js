const crypto = require('crypto');

/**
 * Generates a cryptographically secure numeric OTP of given length
 * @param {number} length Default 6
 * @returns {string} 6-digit OTP
 */
const generateSecureOTP = (length = 6) => {
  const digits = '0123456789';
  const randomBytes = crypto.randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

/**
 * Computes SHA-256 hash of a string (e.g. OTP or token)
 * @param {string} data
 * @returns {string} hex digest
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
};

/**
 * Compares plain data with a SHA-256 hash in constant time
 * @param {string} plainData
 * @param {string} hashedData
 * @returns {boolean}
 */
const compareHash = (plainData, hashedData) => {
  const computed = hashData(plainData);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hashedData));
  } catch {
    return false;
  }
};

/**
 * Generates random hex token (for reset tokens, email verification tokens)
 * @param {number} bytes
 * @returns {string}
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateSecureOTP,
  hashData,
  compareHash,
  generateRandomToken,
};
