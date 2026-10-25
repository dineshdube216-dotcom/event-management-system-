import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authenticateUser = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure');
    
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
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

    if (!user) {
      return res.status(401).json({ success: false, message: 'User session no longer valid.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};
