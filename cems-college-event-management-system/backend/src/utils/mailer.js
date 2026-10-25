import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer transport using env configuration
const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

export const sendOTPEmail = async (toEmail, otpCode, recipientName) => {
  const subject = '🔐 CEMS - Your Account Verification OTP';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border-radius: 12px; background-color: #ffffff; border: 1px solid #E2E8F0;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EEF2FF;">
        <h2 style="color: #1E3A8A; margin: 0; font-size: 24px;">College Event Management System</h2>
        <p style="color: #64748B; margin-top: 4px; font-size: 14px;">Verification Code</p>
      </div>
      <div style="padding: 24px 0;">
        <p style="color: #1E293B; font-size: 16px;">Hello <strong>${recipientName || 'Student'}</strong>,</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Thank you for registering on CEMS! Use the 6-digit verification code below to complete your sign-up process:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #3730A3; background: #EEF2FF; padding: 12px 28px; border-radius: 10px; display: inline-block; border: 1px dashed #6366F1;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #64748B; font-size: 13px;">This OTP will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
      </div>
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 12px;">
        © 2026 College Event Management System (CEMS). All rights reserved.
      </div>
    </div>
  `;

  console.log('\n======================================================');
  console.log(`✉️  [DEV EMAIL OTP] To: ${toEmail} | OTP CODE: ${otpCode}`);
  console.log('======================================================\n');

  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'CEMS System <noreply@cems.college.edu>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ Real Email sent successfully to ${toEmail}`);
    } catch (error) {
      console.error('⚠️ Nodemailer delivery error (falling back to dev log):', error.message);
    }
  }
};

export const sendPasswordResetEmail = async (toEmail, resetToken, recipientName) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  const subject = '🔑 CEMS - Password Reset Request';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border-radius: 12px; background-color: #ffffff; border: 1px solid #E2E8F0;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EEF2FF;">
        <h2 style="color: #1E3A8A; margin: 0; font-size: 24px;">College Event Management System</h2>
        <p style="color: #64748B; margin-top: 4px; font-size: 14px;">Password Reset Request</p>
      </div>
      <div style="padding: 24px 0;">
        <p style="color: #1E293B; font-size: 16px;">Hello <strong>${recipientName || 'User'}</strong>,</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetLink}" style="background-color: #3730A3; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(55, 48, 163, 0.3);">
            Reset My Password
          </a>
        </div>
        <p style="color: #64748B; font-size: 13px;">Or copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #4F46E5;">${resetLink}</a></p>
        <p style="color: #94A3B8; font-size: 12px; margin-top: 16px;">This link will expire in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 12px;">
        © 2026 College Event Management System (CEMS).
      </div>
    </div>
  `;

  console.log('\n======================================================');
  console.log(`✉️  [DEV RESET LINK] To: ${toEmail}`);
  console.log(`👉 Link: ${resetLink}`);
  console.log('======================================================\n');

  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'CEMS System <noreply@cems.college.edu>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ Real Reset Email sent to ${toEmail}`);
    } catch (error) {
      console.error('⚠️ Nodemailer delivery error (falling back to dev log):', error.message);
    }
  }
};
