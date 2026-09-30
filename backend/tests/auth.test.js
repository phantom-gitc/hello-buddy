const { generateSecureOTP, hashData, compareHash } = require('../src/utils/crypto');
const { generateAccessToken, verifyAccessToken } = require('../src/utils/jwt');
const AUTH_CONSTANTS = require('../src/modules/auth/auth.constants');

describe('🛡️ Auth & Security', () => {
  test('🔑 Generate 6-digit secure OTP', () => {
    const otp = generateSecureOTP(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('🔒 Constant-time hash verify', () => {
    const plain = '123456';
    const hash = hashData(plain);
    expect(compareHash(plain, hash)).toBe(true);
    expect(compareHash('654321', hash)).toBe(false);
  });

  test('🎟️ JWT issue and verify', () => {
    const payload = { userId: '507f1f77bcf86cd799439011', role: 'user', email: 'test@example.com' };
    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  test('⏳ Redis TTL and max attempts', () => {
    expect(AUTH_CONSTANTS.MAX_OTP_ATTEMPTS).toBe(5);
    expect(AUTH_CONSTANTS.OTP_EXPIRY_SECONDS).toBe(600);
  });
});
