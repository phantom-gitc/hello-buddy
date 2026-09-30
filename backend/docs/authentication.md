# Authentication & Security Specification

## 1. Authentication Flow

Authentication uses **JWTs** stored in secure, **HTTP-only cookies** and verified against **Redis**:

1. **Registration (`POST /api/v1/auth/register`)**:
   - Creates a user record with `isEmailVerified: false`.
   - Generates a 6-digit cryptographically secure OTP via `crypto.randomBytes`.
   - Computes SHA-256 hash of the OTP and stores `{ hashedOtp, attempts: 0 }` in Redis with a 10-minute TTL.
   - Dispatches a transactional email via Brevo.

2. **Verification (`POST /api/v1/auth/verify-email`)**:
   - Retrieves the OTP record from Redis.
   - Enforces a maximum of 5 attempts.
   - Verifies the OTP in constant time via `crypto.timingSafeEqual`.
   - Sets `isEmailVerified: true`, issues access & refresh tokens, and attaches them as HTTP-only cookies.

3. **Login (`POST /api/v1/auth/login`)**:
   - Verifies email and password (using `bcrypt.compare`).
   - Issues short-lived Access Token (15m) and long-lived Refresh Token (7d).
   - Stores active refresh token in Redis for session verification.

4. **Logout (`POST /api/v1/auth/logout`)**:
   - Immediately adds the current Access Token to a Redis revocation blacklist (`blacklist:<token>`) for its remaining lifespan.
   - Deletes the stored refresh token from Redis (`refreshtoken:<userId>`).
   - Clears HTTP-only cookies on the client.

5. **Token Refresh (`POST /api/v1/auth/refresh`)**:
   - Reads refresh token from HTTP-only cookie.
   - Verifies JWT signature and matches token with Redis session store.
   - Issues a newly rotated token pair.

---

## 2. Cookie Security Configuration

* `httpOnly: true`: Prevents access via `document.cookie` in browser scripts.
* `secure: true`: In production, transmitted only over HTTPS.
* `sameSite: 'strict'` (prod) / `'lax'` (dev): Protects against Cross-Site Request Forgery (CSRF).
