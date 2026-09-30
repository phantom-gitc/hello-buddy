const getResetPasswordTemplate = ({ name, otp }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
        .logo { font-size: 24px; font-weight: 700; color: #f43f5e; margin-bottom: 24px; text-align: center; }
        .otp-box { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f43f5e; text-align: center; background: #0f172a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px dashed #f43f5e; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">HelloBuddy AI</div>
        <h2>Reset Your Password</h2>
        <p>Hello ${name || 'there'},</p>
        <p>We received a request to reset the password for your HelloBuddy AI account. Use this one-time code within 10 minutes:</p>
        <div class="otp-box">${otp}</div>
        <p>If you didn't ask to reset your password, you can safely ignore this message; your account remains secure.</p>
        <div class="footer">&copy; ${new Date().getFullYear()} HelloBuddy AI. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getResetPasswordTemplate };
