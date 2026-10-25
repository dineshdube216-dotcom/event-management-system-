import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// GET /api/analytics/dashboard: Role-specific calculated metrics & visualization datasets
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const { user_id, role } = req.user;

    if (role === 'admin') {
      // 1. University-Wide Admin Analytics
      const [
        totalProposals,
        pendingProposals,
        approvedProposals,
        rejectedProposals,
        publishedEvents,
        draftProposals,
        changesRequestedProposals,
        totalRegistrations,
        clubs,
        allEvents,
        recentTimeline,
      ] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { status: 'pending_approval' } }),
        prisma.event.count({ where: { status: 'approved' } }),
        prisma.event.count({ where: { status: 'rejected' } }),
        prisma.event.count({ where: { status: 'published' } }),
        prisma.event.count({ where: { status: 'draft' } }),
        prisma.event.count({ where: { status: 'changes_requested' } }),
        prisma.registration.count(),
        prisma.club.findMany({
          include: {
            events: {
              select: {
                event_id: true,
                status: true,
                budget: true,
                _count: { select: { registrations: true } },
              },
            },
            mentor: { select: { name: true } },
            president: { select: { name: true } },
          },
        }),
        prisma.event.findMany({
          select: {
            event_id: true,
            title: true,
            status: true,
            event_type: true,
            budget: true,
            created_at: true,
            event_date: true,
          },
        }),
        prisma.proposalTimeline.findMany({
          take: 8,
          orderBy: { created_at: 'desc' },
          include: {
            event: { select: { title: true } },
          },
        }),
      ]);

      // Calculate total allocated budget
      const totalBudget = allEvents.reduce((acc, curr) => acc + (curr.budget || 0), 0);

      // Status breakdown for Doughnut / Pie Chart
      const statusDistribution = [
        { name: 'Published', value: publishedEvents, color: '#059669' }, // Green
        { name: 'Pending Review', value: pendingProposals, color: '#2563EB' }, // Blue
        { name: 'Changes Requested', value: changesRequestedProposals, color: '#D97706' }, // Amber
        { name: 'Approved (Unpublished)', value: approvedProposals, color: '#10B981' }, // Emerald
        { name: 'Drafts', value: draftProposals, color: '#6B7280' }, // Gray
        { name: 'Rejected', value: rejectedProposals, color: '#DC2626' }, // Red
      ].filter((item) => item.value > 0);

      // Club activity distribution
      const clubActivity = clubs.map((club) => {
        const clubEventCount = club.events.length;
        const clubRegCount = club.events.reduce((sum, e) => sum + e._count.registrations, 0);
        const clubBudget = club.events.reduce((sum, e) => sum + (e.budget || 0), 0);
        return {
          club_id: club.club_id,
          club_name: club.club_name,
          proposalsCount: clubEventCount,
          registrationsCount: clubRegCount,
          budget: clubBudget,
          mentorName: club.mentor?.name || 'Unassigned',
        };
      });

      // Monthly proposal trends (last 6 months aggregation)
      const monthlyTrendsMap = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      allEvents.forEach((evt) => {
        const d = new Date(evt.created_at);
        const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (!monthlyTrendsMap[monthKey]) {
          monthlyTrendsMap[monthKey] = { month: monthKey, proposals: 0, published: 0 };
        }
        monthlyTrendsMap[monthKey].proposals += 1;
        if (evt.status === 'published') {
          monthlyTrendsMap[monthKey].published += 1;
        }
      });

      const monthlyTrends = Object.values(monthlyTrendsMap);

      return res.status(200).json({
        success: true,
        role: 'admin',
        metrics: {
          totalProposals,
          pendingProposals,
          approvedProposals,
          rejectedProposals,
          publishedEvents,
          draftProposals,
          changesRequestedProposals,
          totalRegistrations,
          totalBudget,
        },
        visualizations: {
          statusDistribution,
          clubActivity,
          monthlyTrends,
          recentTimeline,
        },
      });
    }

    if (role === 'mentor') {
      // 2. Mentor-Specific Dashboard Analytics
      const mentoredClubs = await prisma.club.findMany({
        where: { mentor_id: user_id },
        include: {
          events: {
            include: {
              creator: { select: { name: true, email: true } },
              _count: { select: { registrations: true, documents: true } },
            },
          },
        },
      });

      const mentoredClubIds = mentoredClubs.map((c) => c.club_id);

      const [
        pendingReviews,
        approvedByMentor,
        changesRequested,
        rejectedCount,
        allMentoredEvents,
        mentorActionsCount,
      ] = await Promise.all([
        prisma.event.findMany({
          where: {
            club_id: { in: mentoredClubIds },
            status: 'pending_approval',
          },
          include: {
            creator: { select: { name: true, email: true } },
            club: { select: { club_name: true } },
            _count: { select: { documents: true } },
          },
          orderBy: { updated_at: 'asc' },
        }),
        prisma.event.count({
          where: {
            club_id: { in: mentoredClubIds },
            status: { in: ['approved', 'published'] },
          },
        }),
        prisma.event.count({
          where: {
            club_id: { in: mentoredClubIds },
            status: 'changes_requested',
          },
        }),
        prisma.event.count({
          where: {
            club_id: { in: mentoredClubIds },
            status: 'rejected',
          },
        }),
        prisma.event.findMany({
          where: { club_id: { in: mentoredClubIds } },
        }),
        prisma.event_Approval.count({
          where: { mentor_id: user_id },
        }),
      ]);

      const totalProposalsInMentoredClubs = allMentoredEvents.length;

      const mentorStatusDistribution = [
        { name: 'Pending Review', value: pendingReviews.length, color: '#2563EB' },
        { name: 'Approved', value: approvedByMentor, color: '#059669' },
        { name: 'Changes Requested', value: changesRequested, color: '#D97706' },
        { name: 'Rejected', value: rejectedCount, color: '#DC2626' },
      ].filter((i) => i.value > 0);

      const clubBreakdown = mentoredClubs.map((club) => ({
        club_name: club.club_name,
        total: club.events.length,
        pending: club.events.filter((e) => e.status === 'pending_approval').length,
        approved: club.events.filter((e) => e.status === 'approved' || e.status === 'published').length,
      }));

      return res.status(200).json({
        success: true,
        role: 'mentor',
        metrics: {
          pendingCount: pendingReviews.length,
          approvedCount: approvedByMentor,
          changesRequestedCount: changesRequested,
          rejectedCount: rejectedCount,
          totalUnderMentorship: totalProposalsInMentoredClubs,
          totalActionsCompleted: mentorActionsCount,
        },
        pendingQueue: pendingReviews,
        visualizations: {
          statusDistribution: mentorStatusDistribution,
          clubBreakdown,
        },
      });
    }

    if (role === 'president') {
      // 3. Club President Analytics
      const myClubs = await prisma.club.findMany({
        where: { president_id: user_id },
        include: {
          mentor: { select: { name: true, email: true } },
          events: {
            include: {
              _count: { select: { registrations: true, documents: true } },
            },
          },
        },
      });

      const clubIds = myClubs.map((c) => c.club_id);

      const myEvents = await prisma.event.findMany({
        where: {
          OR: [
            { club_id: { in: clubIds } },
            { created_by: user_id },
          ],
        },
        include: {
          _count: { select: { registrations: true } },
        },
      });

      const totalClubProposals = myEvents.length;
      const draftCount = myEvents.filter((e) => e.status === 'draft').length;
      const pendingCount = myEvents.filter((e) => e.status === 'pending_approval').length;
      const changesRequestedCount = myEvents.filter((e) => e.status === 'changes_requested').length;
      const approvedCount = myEvents.filter((e) => e.status === 'approved').length;
      const publishedCount = myEvents.filter((e) => e.status === 'published').length;
      const totalRegistrations = myEvents.reduce((sum, e) => sum + e._count.registrations, 0);
      const totalBudgetRequested = myEvents.reduce((sum, e) => sum + (e.budget || 0), 0);

      const presidentStatusDistribution = [
        { name: 'Published', value: publishedCount, color: '#059669' },
        { name: 'Approved', value: approvedCount, color: '#10B981' },
        { name: 'Under Mentor Review', value: pendingCount, color: '#2563EB' },
        { name: 'Changes Requested', value: changesRequestedCount, color: '#D97706' },
        { name: 'Drafts', value: draftCount, color: '#6B7280' },
      ].filter((i) => i.value > 0);

      const eventAttendanceData = myEvents
        .filter((e) => e.status === 'published')
        .map((e) => ({
          title: e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title,
          registrations: e._count.registrations,
          capacity: e.expected_attendees || 50,
        }));

      return res.status(200).json({
        success: true,
        role: 'president',
        club: myClubs[0] || null,
        metrics: {
          totalProposals: totalClubProposals,
          draftCount,
          pendingCount,
          changesRequestedCount,
          approvedCount,
          publishedCount,
          totalRegistrations,
          totalBudgetRequested,
        },
        visualizations: {
          statusDistribution: presidentStatusDistribution,
          eventAttendanceData,
        },
      });
    }

    // 4. Student Analytics
    const studentRegistrations = await prisma.registration.findMany({
      where: { student_id: user_id },
      include: {
        event: {
          select: {
            event_id: true,
            title: true,
            event_date: true,
            venue: true,
            event_type: true,
            status: true,
          },
        },
      },
    });

    const now = new Date();
    const upcomingCount = studentRegistrations.filter((r) => new Date(r.event.event_date) >= now).length;
    const pastCount = studentRegistrations.filter((r) => new Date(r.event.event_date) < now).length;

    return res.status(200).json({
      success: true,
      role: 'student',
      metrics: {
        totalRegistrations: studentRegistrations.length,
        upcomingCount,
        pastCount,
      },
      registrations: studentRegistrations,
    });
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate analytics: ' + error.message });
  }
});

export default router;
