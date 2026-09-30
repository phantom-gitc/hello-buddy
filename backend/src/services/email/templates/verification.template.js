const getVerificationTemplate = ({ name, otp }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
        .logo { font-size: 24px; font-weight: 700; color: #38bdf8; margin-bottom: 24px; text-align: center; }
        .otp-box { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; text-align: center; background: #0f172a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px dashed #38bdf8; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">HelloBuddy AI</div>
        <h2>Verify Your Email</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Welcome to HelloBuddy AI Career Prep. Use the verification code below to confirm your email address. This code is valid for 10 minutes.</p>
        <div class="otp-box">${otp}</div>
        <p>If you did not request this verification code, please disregard this email.</p>
        <div class="footer">&copy; ${new Date().getFullYear()} HelloBuddy AI. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getVerificationTemplate };
