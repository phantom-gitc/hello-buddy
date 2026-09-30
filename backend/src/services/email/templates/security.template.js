const getSecurityNotificationTemplate = ({ name, action, timestamp, ip }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Security Alert</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
        .logo { font-size: 24px; font-weight: 700; color: #eab308; margin-bottom: 24px; text-align: center; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">HelloBuddy AI Security</div>
        <h2>Account Activity Alert</h2>
        <p>Hello ${name || 'User'},</p>
        <p>This is a notification regarding your account: <strong>${action}</strong>.</p>
        <p><strong>Time:</strong> ${timestamp || new Date().toUTCString()}</p>
        <p><strong>IP Address:</strong> ${ip || 'Unknown'}</p>
        <p>If you did not perform this action, please reset your password immediately and contact support.</p>
        <div class="footer">&copy; ${new Date().getFullYear()} HelloBuddy AI. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getSecurityNotificationTemplate };
