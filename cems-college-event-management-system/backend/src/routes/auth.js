import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/mailer.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate a 6-digit OTP code
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. SIGNUP: Student / User sign-up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, department, adt_no, phone_no, photo_url } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      if (existingUser.email_verified) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login.' });
      } else {
        // If existing user is not verified yet, update their info and resend OTP
        const password_hash = await bcrypt.hash(password, 10);
        const updatedUser = await prisma.user.update({
          where: { user_id: existingUser.user_id },
          data: {
            name,
            password_hash,
            role: role || 'student',
            department: department || null,
            adt_no: adt_no || null,
            phone_no: phone_no || null,
            photo_url: photo_url || null,
          },
        });

        // Invalidate old OTPs
        await prisma.oTP_Verification.deleteMany({
          where: { user_id: updatedUser.user_id, purpose: 'email_verification' },
        });

        // Generate new OTP
        const otpCode = generateOTPCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.oTP_Verification.create({
          data: {
            user_id: updatedUser.user_id,
            otp_code: otpCode,
            purpose: 'email_verification',
            expires_at: expiresAt,
          },
        });

        await sendOTPEmail(updatedUser.email, otpCode, updatedUser.name);

        return res.status(200).json({
          success: true,
          message: 'Registration updated. A new 6-digit OTP code has been sent to your email.',
          email: updatedUser.email,
          dev_otp: otpCode, // Included for easy dev evaluation!
        });
      }
    }

    // Hash password & create user
    const password_hash = await bcrypt.hash(password, 10);
    const userRole = ['admin', 'mentor', 'president', 'student'].includes(role) ? role : 'student';

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password_hash,
        role: userRole,
        department: department || null,
        adt_no: adt_no || null,
        phone_no: phone_no || null,
        photo_url: photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        email_verified: false,
      },
    });

    // Generate 6-digit OTP code
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.oTP_Verification.create({
      data: {
        user_id: newUser.user_id,
        otp_code: otpCode,
        purpose: 'email_verification',
        expires_at: expiresAt,
      },
    });

    await sendOTPEmail(newUser.email, otpCode, newUser.name);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the 6-digit OTP verification code.',
      email: newUser.email,
      dev_otp: otpCode, // Provided for instant evaluation
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup: ' + error.message });
  }
});

// 2. VERIFY OTP: Email verification with 6-digit code
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const otpRecord = await prisma.oTP_Verification.findFirst({
      where: {
        user_id: user.user_id,
        purpose: 'email_verification',
        is_used: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No active OTP verification code found. Please request a new code.' });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please click Resend OTP.' });
    }

    if (otpRecord.otp_code !== otp_code.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit OTP code. Please check and try again.' });
    }

    // Mark OTP as used and user email as verified
    await prisma.oTP_Verification.update({
      where: { otp_id: otpRecord.otp_id },
      data: { is_used: true },
    });

    const updatedUser = await prisma.user.update({
      where: { user_id: user.user_id },
      data: { email_verified: true },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        adt_no: true,
        phone_no: true,
        photo_url: true,
        email_verified: true,
      },
    });

    // Auto-issue JWT token upon verification
    const secret = process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure';
    const token = jwt.sign({ userId: updatedUser.user_id, role: updatedUser.role }, secret, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true in HTTPS prod
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      user: updatedUser,
      token,
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification: ' + error.message });
  }
});

// 3. RESEND OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Your email address is already verified. Please log in.' });
    }

    // Invalidate existing active OTPs
    await prisma.oTP_Verification.updateMany({
      where: { user_id: user.user_id, purpose: 'email_verification', is_used: false },
      data: { is_used: true },
    });

    // Create new OTP
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP_Verification.create({
      data: {
        user_id: user.user_id,
        otp_code: otpCode,
        purpose: 'email_verification',
        expires_at: expiresAt,
      },
    });

    await sendOTPEmail(user.email, otpCode, user.name);

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit OTP code has been sent to your email.',
      dev_otp: otpCode,
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during OTP resend: ' + error.message });
  }
});

// 4. LOGIN: JWT authentication supporting all 4 roles (admin, mentor, president, student)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      // Send fresh OTP code
      const otpCode = generateOTPCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.oTP_Verification.create({
        data: {
          user_id: user.user_id,
          otp_code: otpCode,
          purpose: 'email_verification',
          expires_at: expiresAt,
        },
      });

      await sendOTPEmail(user.email, otpCode, user.name);

      return res.status(403).json({
        success: false,
        requires_verification: true,
        email: user.email,
        message: 'Your email address is not verified yet. A new OTP has been sent to your email.',
        dev_otp: otpCode,
      });
    }

    // Issue JWT token
    const secret = process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure';
    const token = jwt.sign({ userId: user.user_id, role: user.role }, secret, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      adt_no: user.adt_no,
      phone_no: user.phone_no,
      photo_url: user.photo_url,
      email_verified: user.email_verified,
    };

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login: ' + error.message });
  }
});

// 5. FORGOT PASSWORD: Email reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Return success to avoid email enumeration security risk
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, a password reset link has been sent.',
      });
    }

    // Generate random reset token string
    const resetToken = jwt.sign(
      { userId: user.user_id, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure',
      { expiresIn: '30m' }
    );

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.oTP_Verification.create({
      data: {
        user_id: user.user_id,
        otp_code: resetToken,
        purpose: 'password_reset',
        expires_at: expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, resetToken, user.name);

    return res.status(200).json({
      success: true,
      message: 'A password reset link has been emailed to you.',
      dev_reset_link: `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset request: ' + error.message });
  }
});

// 6. RESET PASSWORD: Set new password using token from URL
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const secret = process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    const otpRecord = await prisma.oTP_Verification.findFirst({
      where: {
        user_id: decoded.userId,
        otp_code: token,
        purpose: 'password_reset',
        is_used: false,
      },
    });

    if (!otpRecord || new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    // Hash new password and update user
    const newPasswordHash = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { user_id: decoded.userId },
      data: { password_hash: newPasswordHash },
    });

    // Mark reset token as used
    await prisma.oTP_Verification.update({
      where: { otp_id: otpRecord.otp_id },
      data: { is_used: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error resetting password: ' + error.message });
  }
});

// 7. GET ME: Get current authenticated user
router.get('/me', authenticateUser, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// 8. LOGOUT: Clear token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

export default router;
