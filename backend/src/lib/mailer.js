import nodemailer from "nodemailer";
import ENV from "./env.js";

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

/**
 * Sends a beautiful HTML verification email.
 * @param {string} to - Recipient email address
 * @param {string} token - Raw (unhashed) verification token
 */
export const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${ENV.CLIENT_URL}/verify-email/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background:#111827;border-radius:16px;border:1px solid rgba(99,102,241,0.2);overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MeetFlow</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Video Meetings, Simplified</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 32px;">
                  <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">Verify Your Email ✉️</h2>
                  <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                    Thanks for signing up! Click the button below to verify your email address and unlock full access to your MeetFlow account.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${verifyUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Verify Email Address
                    </a>
                  </div>
                  <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin:0 0 24px;color:#6366f1;font-size:12px;word-break:break-all;">${verifyUrl}</p>
                  <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
                    <p style="margin:0;color:#475569;font-size:12px;">
                      ⏱ This link expires in <strong style="color:#94a3b8;">24 hours</strong>. If you didn't create a MeetFlow account, you can safely ignore this email.
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:16px 32px 24px;text-align:center;">
                  <p style="margin:0;color:#334155;font-size:12px;">© ${new Date().getFullYear()} MeetFlow · All rights reserved</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"MeetFlow" <${ENV.EMAIL_USER}>`,
    to,
    subject: "Verify your MeetFlow email address",
    html,
  });
};
