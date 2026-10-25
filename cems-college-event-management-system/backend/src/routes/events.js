import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { authenticateUser } from '../middleware/auth.js';
import { broadcastToAll, broadcastMetricsUpdate } from '../realtime.js';

const router = express.Router();

// Helper to optionally extract authenticated user without throwing error
const getOptionalUser = (req) => {
  const token = req.cookies?.cems_token || req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_secure');
  } catch (e) {
    return null;
  }
};

// 1. GET /api/events: List all published events for student feed
router.get('/', async (req, res) => {
  try {
    const { type, search, sort } = req.query;
    const currentUser = getOptionalUser(req);

    // Filter conditions: only published events visible in public feed
    const whereCondition = {
      status: 'published',
    };

    // Event type filter: 'official' or 'club'
    if (type && type !== 'all') {
      whereCondition.event_type = type;
    }

    // Search query term
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      whereCondition.OR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { venue: { contains: searchTerm } },
      ];
    }

    // Sorting strategy
    let orderBy = { created_at: 'desc' }; // default: newest first
    if (sort === 'event_date') {
      orderBy = { event_date: 'asc' };
    } else if (sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
      orderBy,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            role: true,
            photo_url: true,
          },
        },
        club: {
          select: {
            club_id: true,
            club_name: true,
          },
        },
        registrations: currentUser?.user_id
          ? {
              where: { student_id: currentUser.user_id },
              select: { registration_id: true },
            }
          : false,
        _count: {
          select: { registrations: true },
        },
      },
    });

    // Format output
    const formattedEvents = events.map((event) => ({
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      event_type: event.event_type, // 'official' | 'club'
      event_date: event.event_date,
      venue: event.venue,
      budget: event.budget,
      expected_attendees: event.expected_attendees,
      banner_image_url: event.banner_image_url,
      registration_link: event.registration_link,
      is_highlighted: event.is_highlighted,
      created_at: event.created_at,
      organizer:
        event.event_type === 'official'
          ? 'University Administration'
          : event.club?.club_name || 'Student Club',
      registration_count: event._count.registrations,
      is_registered: event.registrations && event.registrations.length > 0,
    }));

    return res.status(200).json({
      success: true,
      count: formattedEvents.length,
      events: formattedEvents,
    });
  } catch (error) {
    console.error('Fetch Events Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events feed: ' + error.message });
  }
});

// 2. GET /api/events/clubs: List all registered clubs with mentors & presidents
router.get('/meta/clubs', async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { club_name: 'asc' },
      include: {
        mentor: { select: { user_id: true, name: true, email: true, department: true } },
        president: { select: { user_id: true, name: true, email: true } },
        _count: { select: { events: true } },
      },
    });

    return res.status(200).json({ success: true, clubs });
  } catch (error) {
    console.error('Fetch Clubs Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch clubs: ' + error.message });
  }
});

// 3. GET /api/events/my-registrations: Fetch student registered events
router.get('/user/my-registrations', authenticateUser, async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { student_id: req.user.user_id },
      orderBy: { registered_at: 'desc' },
      include: {
        event: {
          include: {
            club: { select: { club_name: true } },
            creator: { select: { name: true } },
            _count: { select: { registrations: true } },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      registrations: registrations.map((r) => ({
        registration_id: r.registration_id,
        registered_at: r.registered_at,
        event: {
          ...r.event,
          registration_count: r.event._count.registrations,
          organizer: r.event.event_type === 'official' ? 'University Administration' : r.event.club?.club_name,
        },
      })),
    });
  } catch (error) {
    console.error('Fetch My Registrations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your registrations: ' + error.message });
  }
});

// 4. GET /api/events/:id: Fetch single event details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = getOptionalUser(req);

    const event = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        creator: {
          select: {
            name: true,
            role: true,
            department: true,
            photo_url: true,
          },
        },
        club: {
          select: {
            club_id: true,
            club_name: true,
          },
        },
        registrations: currentUser?.user_id
          ? {
              where: { student_id: currentUser.user_id },
            }
          : false,
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(200).json({
      success: true,
      event: {
        ...event,
        organizer:
          event.event_type === 'official'
            ? 'University Administration'
            : event.club?.club_name || 'Student Club',
        registration_count: event._count.registrations,
        is_registered: event.registrations && event.registrations.length > 0,
      },
    });
  } catch (error) {
    console.error('Fetch Event Detail Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event detail: ' + error.message });
  }
});

// 5. POST /api/events/:id/register: Register student for event
router.post('/:id/register', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const event = await prisma.event.findUnique({
      where: { event_id: id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Cannot register for an unpublished event.' });
    }

    // Check existing registration
    const existingReg = await prisma.registration.findUnique({
      where: {
        event_id_student_id: {
          event_id: id,
          student_id: userId,
        },
      },
    });

    if (existingReg) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event!' });
    }

    // Create registration
    const newReg = await prisma.registration.create({
      data: {
        event_id: id,
        student_id: userId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        event_id: id,
        title: 'Registration Confirmed',
        message: `You are officially registered for "${event.title}". We look forward to seeing you at ${event.venue}!`,
        channel: 'in_app',
      },
    });

    const newCount = event._count.registrations + 1;

    // Real-time broadcast for registration update
    broadcastToAll('REGISTRATION_UPDATED', {
      event_id: id,
      title: event.title,
      registration_count: newCount,
      studentName: req.user.name,
      studentId: userId,
      action: 'registered',
    });

    broadcastMetricsUpdate('all');

    return res.status(201).json({
      success: true,
      message: `Successfully registered for ${event.title}!`,
      registration: newReg,
      registration_count: newCount,
    });
  } catch (error) {
    console.error('Event Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register for event: ' + error.message });
  }
});

// 6. DELETE /api/events/:id/register: Cancel student registration
router.delete('/:id/register', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const event = await prisma.event.findUnique({
      where: { event_id: id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existingReg = await prisma.registration.findUnique({
      where: {
        event_id_student_id: {
          event_id: id,
          student_id: userId,
        },
      },
    });

    if (!existingReg) {
      return res.status(404).json({ success: false, message: 'No active registration found to cancel.' });
    }

    await prisma.registration.delete({
      where: {
        event_id_student_id: {
          event_id: id,
          student_id: userId,
        },
      },
    });

    const newCount = Math.max(0, event._count.registrations - 1);

    // Broadcast real-time update
    broadcastToAll('REGISTRATION_UPDATED', {
      event_id: id,
      title: event.title,
      registration_count: newCount,
      studentName: req.user.name,
      studentId: userId,
      action: 'cancelled',
    });

    broadcastMetricsUpdate('all');

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.',
      registration_count: newCount,
    });
  } catch (error) {
    console.error('Cancel Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel registration: ' + error.message });
  }
});

export default router;
