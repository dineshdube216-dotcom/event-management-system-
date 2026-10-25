import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// 1. GET /api/notifications: Fetch current user notifications
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { user_id } = req.user;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id },
        orderBy: { sent_at: 'desc' },
        take: 30,
        include: {
          event: {
            select: {
              event_id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { user_id, is_read: false },
      }),
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications: ' + error.message });
  }
});

// 2. PUT /api/notifications/:id/read: Mark single notification as read
router.put('/:id/read', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const notification = await prisma.notification.findUnique({
      where: { notification_id: id },
    });

    if (!notification || notification.user_id !== user_id) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { notification_id: id },
      data: { is_read: true },
    });

    return res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification: ' + error.message });
  }
});

// 3. PUT /api/notifications/read-all: Mark all notifications as read
router.put('/read-all', authenticateUser, async (req, res) => {
  try {
    const { user_id } = req.user;

    await prisma.notification.updateMany({
      where: { user_id, is_read: false },
      data: { is_read: true },
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications: ' + error.message });
  }
});

export default router;
