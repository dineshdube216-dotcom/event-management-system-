import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateUser } from '../middleware/auth.js';
import { broadcastToRole, broadcastToUser, broadcastToAll, broadcastMetricsUpdate } from '../realtime.js';
import { generateWordProposalDossier } from '../utils/wordExport.js';
import { generatePdfProposalDossier } from '../utils/pdfExport.js';
import { generateDefaultProposalTemplate } from '../utils/templateHelper.js';

const router = express.Router();

// Helper to check role authorization
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};

// 1. GET /api/proposals: List proposals filtered by user role and query filters
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, search, club_id } = req.query;
    const { user_id, role } = req.user;

    const whereCondition = {};

    // Role-based scoping
    if (role === 'admin') {
      if (club_id) whereCondition.club_id = club_id;
    } else if (role === 'mentor') {
      const mentoredClubs = await prisma.club.findMany({
        where: { mentor_id: user_id },
        select: { club_id: true },
      });
      const clubIds = mentoredClubs.map((c) => c.club_id);
      whereCondition.club_id = { in: clubIds };
    } else if (role === 'president') {
      const ledClubs = await prisma.club.findMany({
        where: { president_id: user_id },
        select: { club_id: true },
      });
      const clubIds = ledClubs.map((c) => c.club_id);
      whereCondition.OR = [
        { club_id: { in: clubIds } },
        { created_by: user_id },
      ];
    } else {
      return res.status(403).json({ success: false, message: 'Access denied: Students cannot access proposals workflow' });
    }

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      const searchOR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { venue: { contains: term } },
      ];
      if (whereCondition.OR) {
        whereCondition.AND = [
          { OR: whereCondition.OR },
          { OR: searchOR },
        ];
        delete whereCondition.OR;
      } else {
        whereCondition.OR = searchOR;
      }
    }

    const proposals = await prisma.event.findMany({
      where: whereCondition,
      orderBy: { updated_at: 'desc' },
      include: {
        creator: {
          select: {
            user_id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            photo_url: true,
          },
        },
        club: {
          include: {
            mentor: {
              select: {
                user_id: true,
                name: true,
                email: true,
                department: true,
              },
            },
            president: {
              select: {
                user_id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        approvals: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        certificates: {
          take: 1,
        },
        _count: {
          select: {
            documents: true,
            timeline: true,
            registrations: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    console.error('Fetch Proposals Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch proposals: ' + error.message });
  }
});

// 2. GET /api/proposals/:id: Fetch full proposal detail with documents & timeline
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.user;

    const proposal = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        creator: {
          select: {
            user_id: true,
            name: true,
            email: true,
            department: true,
            role: true,
            photo_url: true,
          },
        },
        club: {
          include: {
            mentor: {
              select: {
                user_id: true,
                name: true,
                email: true,
                department: true,
              },
            },
            president: {
              select: {
                user_id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        approvals: {
          include: {
            mentor: {
              select: {
                name: true,
                email: true,
                department: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        documents: {
          orderBy: { uploaded_at: 'desc' },
          include: {
            uploader: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        timeline: {
          orderBy: { created_at: 'asc' },
        },
        certificates: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (role === 'mentor') {
      const isMentorOfClub = proposal.club?.mentor_id === user_id;
      if (!isMentorOfClub && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to mentor this club' });
      }
    } else if (role === 'president') {
      const isClubPresident = proposal.club?.president_id === user_id || proposal.created_by === user_id;
      if (!isClubPresident && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized: You do not have permission for this club' });
      }
    } else if (role === 'student' && proposal.status !== 'published') {
      return res.status(403).json({ success: false, message: 'Forbidden: Students can only view published events' });
    }

    return res.status(200).json({
      success: true,
      proposal,
    });
  } catch (error) {
    console.error('Fetch Proposal Detail Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch proposal details: ' + error.message });
  }
});

// 3. POST /api/proposals: Create a new event proposal with AUTO-GENERATED TEMPLATE DOCUMENT
router.post('/', authenticateUser, checkRole('president', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      club_id,
      event_date,
      venue,
      budget,
      expected_attendees,
      event_type,
      banner_image_url,
      registration_link,
      submit_for_review,
    } = req.body;

    if (!title || !description || !event_date || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, event_date, and venue are mandatory',
      });
    }

    const status = submit_for_review ? 'pending_approval' : 'draft';
    const isOfficial = req.user.role === 'admin' && (event_type === 'official' || !club_id);

    // Fetch club info for template defaults
    let club = null;
    if (club_id) {
      club = await prisma.club.findUnique({
        where: { club_id },
        include: { mentor: true },
      });
    }

    // Auto-generate standardized proposal template JSON
    const tempEvent = {
      title: title.trim(),
      description: description.trim(),
      event_date,
      venue: venue.trim(),
      budget: parseFloat(budget) || 0,
      expected_attendees: parseInt(expected_attendees, 10) || 50,
    };
    const defaultTemplate = generateDefaultProposalTemplate(tempEvent, club, req.user, club?.mentor);

    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        created_by: req.user.user_id,
        club_id: isOfficial ? null : club_id || null,
        status,
        event_type: isOfficial ? 'official' : 'club',
        event_date: new Date(event_date),
        venue: venue.trim(),
        budget: parseFloat(budget) || 0,
        expected_attendees: parseInt(expected_attendees, 10) || 50,
        banner_image_url: banner_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        registration_link: registration_link || null,
        proposal_document_content: JSON.stringify(defaultTemplate),
        is_highlighted: isOfficial,
      },
      include: {
        creator: { select: { name: true, email: true, role: true } },
        club: {
          include: {
            mentor: { select: { user_id: true, name: true, email: true } },
          },
        },
      },
    });

    // Automatically attach the standardized proposal document
    await prisma.document.create({
      data: {
        event_id: newEvent.event_id,
        file_name: `CEMS_Proposal_Template_${newEvent.event_id}.docx`,
        original_name: `${newEvent.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Official_Dossier_v1.0.docx`,
        file_size: 42000,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_path: 'auto_generated_template',
        document_type: 'proposal',
        version: 'v1.0',
        status: submit_for_review ? 'submitted_for_review' : 'draft',
        uploaded_by: req.user.user_id,
        remarks: 'Auto-generated standardized proposal template auto-filled from event specifications',
      },
    });

    // Record timeline: created
    await prisma.proposalTimeline.create({
      data: {
        event_id: newEvent.event_id,
        stage: 'draft_created',
        title: 'Proposal Draft Initialized',
        description: `Proposal draft initialized by ${req.user.name} (${req.user.role}). Standard template auto-generated.`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: req.user.role,
      },
    });

    await prisma.proposalTimeline.create({
      data: {
        event_id: newEvent.event_id,
        stage: 'documents_uploaded',
        title: 'Official Proposal Dossier Auto-Populated',
        description: `Standardized university event proposal template populated with budget breakdown and schedule.`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: req.user.role,
      },
    });

    if (submit_for_review) {
      await prisma.proposalTimeline.create({
        data: {
          event_id: newEvent.event_id,
          stage: 'submitted',
          title: 'Submitted for Mentor Review',
          description: `Submitted by ${req.user.name} for faculty review.`,
          actor_id: req.user.user_id,
          actor_name: req.user.name,
          actor_role: req.user.role,
        },
      });

      const mentorId = newEvent.club?.mentor?.user_id;
      if (mentorId) {
        await prisma.notification.create({
          data: {
            user_id: mentorId,
            event_id: newEvent.event_id,
            title: 'New Event Proposal Submitted',
            message: `${req.user.name} submitted proposal "${newEvent.title}" with standardized dossier for review.`,
            channel: 'in_app',
          },
        });

        broadcastToUser(mentorId, 'PROPOSAL_SUBMITTED', {
          event_id: newEvent.event_id,
          title: newEvent.title,
          club: newEvent.club?.club_name,
          proposer: req.user.name,
          submittedAt: new Date().toISOString(),
        });
      }

      broadcastToRole('admin', 'PROPOSAL_SUBMITTED', {
        event_id: newEvent.event_id,
        title: newEvent.title,
        club: newEvent.club?.club_name,
        proposer: req.user.name,
        submittedAt: new Date().toISOString(),
      });
    }

    broadcastMetricsUpdate('all');

    return res.status(201).json({
      success: true,
      message: submit_for_review ? 'Proposal created and submitted for review successfully' : 'Draft proposal saved successfully',
      event: newEvent,
    });
  } catch (error) {
    console.error('Create Proposal Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create proposal: ' + error.message });
  }
});

// 4. GET /api/proposals/:id/document-template: Retrieve editable common template JSON
router.get('/:id/document-template', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        creator: true,
        club: { include: { mentor: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let templateContent = null;
    if (event.proposal_document_content) {
      try {
        templateContent = JSON.parse(event.proposal_document_content);
      } catch (e) {}
    }

    if (!templateContent) {
      templateContent = generateDefaultProposalTemplate(event, event.club, event.creator, event.club?.mentor);
      // Persist generated default
      await prisma.event.update({
        where: { event_id: id },
        data: { proposal_document_content: JSON.stringify(templateContent) },
      });
    }

    return res.status(200).json({
      success: true,
      event_id: id,
      title: event.title,
      template: templateContent,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. PUT /api/proposals/:id/document-template: Save in-app edits to standardized template
router.put('/:id/document-template', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({ success: false, message: 'Template content is required' });
    }

    const event = await prisma.event.findUnique({
      where: { event_id: id },
      include: { club: true },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization check
    const isOwner = event.created_by === req.user.user_id;
    const isPresident = event.club?.president_id === req.user.user_id;
    const isMentor = event.club?.mentor_id === req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isPresident && !isMentor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this proposal document' });
    }

    const updatedEvent = await prisma.event.update({
      where: { event_id: id },
      data: {
        proposal_document_content: typeof template === 'string' ? template : JSON.stringify(template),
      },
    });

    // Record timeline entry for document edit
    await prisma.proposalTimeline.create({
      data: {
        event_id: id,
        stage: 'documents_uploaded',
        title: 'Proposal Document Template Updated In-App',
        description: `Official dossier sections, schedule, or budget modified by ${req.user.name} (${req.user.role}).`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: req.user.role,
      },
    });

    broadcastToAll('DOCUMENT_UPDATED', {
      event_id: id,
      message: 'Proposal template updated in-app',
      updatedBy: req.user.name,
    });

    return res.status(200).json({
      success: true,
      message: 'Official proposal template saved and updated successfully',
      event: updatedEvent,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. GET /api/proposals/:id/event-dashboard: Dedicated deep-dive analytics for a single event
router.get('/:id/event-dashboard', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        creator: { select: { user_id: true, name: true, email: true, department: true } },
        club: {
          include: {
            mentor: { select: { user_id: true, name: true, email: true, department: true } },
            president: { select: { user_id: true, name: true, email: true } },
          },
        },
        approvals: {
          include: { mentor: { select: { name: true, email: true } } },
          orderBy: { created_at: 'desc' },
        },
        timeline: { orderBy: { created_at: 'asc' } },
        documents: { orderBy: { uploaded_at: 'desc' } },
        certificates: true,
        registrations: {
          orderBy: { registered_at: 'desc' },
          include: {
            student: {
              select: {
                user_id: true,
                name: true,
                email: true,
                department: true,
                adt_no: true,
                phone_no: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const totalRegistrations = event.registrations.length;
    const capacity = event.expected_attendees || 100;
    const capacityPercentage = Math.min(100, Math.round((totalRegistrations / capacity) * 100));
    const remainingSpots = Math.max(0, capacity - totalRegistrations);

    // Registration velocity over time (grouped by date)
    const velocityMap = {};
    event.registrations.forEach((r) => {
      const d = new Date(r.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      velocityMap[d] = (velocityMap[d] || 0) + 1;
    });

    const velocityData = Object.entries(velocityMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Department breakdown
    const deptMap = {};
    event.registrations.forEach((r) => {
      const dept = r.student?.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const departmentBreakdown = Object.entries(deptMap).map(([dept, count]) => ({
      department: dept.length > 15 ? dept.substring(0, 15) + '...' : dept,
      count,
    }));

    // Budget data from template
    let budgetBreakdown = [];
    if (event.proposal_document_content) {
      try {
        const parsed = JSON.parse(event.proposal_document_content);
        if (parsed.budget_breakdown) {
          budgetBreakdown = parsed.budget_breakdown;
        }
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      event: {
        event_id: event.event_id,
        title: event.title,
        description: event.description,
        status: event.status,
        event_type: event.event_type,
        event_date: event.event_date,
        venue: event.venue,
        budget: event.budget,
        expected_attendees: capacity,
        created_at: event.created_at,
        club: event.club,
        creator: event.creator,
        approvals: event.approvals,
        timeline: event.timeline,
        documents: event.documents,
        certificate: event.certificates?.[0] || null,
      },
      analytics: {
        totalRegistrations,
        capacity,
        capacityPercentage,
        remainingSpots,
        velocityData,
        departmentBreakdown,
        budgetBreakdown,
        roster: event.registrations.map((r) => ({
          registration_id: r.registration_id,
          registered_at: r.registered_at,
          student_name: r.student?.name,
          student_email: r.student?.email,
          student_department: r.student?.department,
          adt_no: r.student?.adt_no || 'N/A',
        })),
      },
    });
  } catch (err) {
    console.error('Fetch Event Dashboard Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 7. PUT /api/proposals/:id: Update proposal
router.put('/:id', authenticateUser, checkRole('president', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      event_date,
      venue,
      budget,
      expected_attendees,
      banner_image_url,
      registration_link,
      resubmit,
    } = req.body;

    const existingEvent = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        club: { include: { mentor: true } },
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (req.user.role !== 'admin' && existingEvent.created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this proposal' });
    }

    const wasChangesRequested = existingEvent.status === 'changes_requested';
    const newStatus = resubmit || wasChangesRequested ? 'pending_approval' : existingEvent.status;

    const updatedEvent = await prisma.event.update({
      where: { event_id: id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(event_date && { event_date: new Date(event_date) }),
        ...(venue && { venue: venue.trim() }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(expected_attendees !== undefined && { expected_attendees: parseInt(expected_attendees, 10) }),
        ...(banner_image_url && { banner_image_url }),
        ...(registration_link !== undefined && { registration_link }),
        status: newStatus,
      },
      include: {
        creator: true,
        club: { include: { mentor: true } },
      },
    });

    if (resubmit || wasChangesRequested) {
      await prisma.proposalTimeline.create({
        data: {
          event_id: id,
          stage: 'resubmitted',
          title: 'Proposal Resubmitted with Revisions',
          description: `Updated by ${req.user.name} addressing previous reviewer remarks.`,
          actor_id: req.user.user_id,
          actor_name: req.user.name,
          actor_role: req.user.role,
        },
      });

      const mentorId = updatedEvent.club?.mentor?.user_id;
      if (mentorId) {
        await prisma.notification.create({
          data: {
            user_id: mentorId,
            event_id: id,
            title: 'Proposal Resubmitted',
            message: `${req.user.name} updated and resubmitted proposal "${updatedEvent.title}" for your review.`,
            channel: 'in_app',
          },
        });

        broadcastToUser(mentorId, 'PROPOSAL_STATUS_CHANGED', {
          event_id: id,
          title: updatedEvent.title,
          status: 'pending_approval',
          message: 'Proposal has been updated and resubmitted for review.',
        });
      }
    }

    broadcastMetricsUpdate('all');

    return res.status(200).json({
      success: true,
      message: 'Proposal updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Update Proposal Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update proposal: ' + error.message });
  }
});

// 8. POST /api/proposals/:id/submit: Submit a draft proposal for mentor review
router.post('/:id/submit', authenticateUser, checkRole('president', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.event.findUnique({
      where: { event_id: id },
      include: { club: { include: { mentor: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (existing.status !== 'draft' && existing.status !== 'changes_requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit proposal in '${existing.status}' status.`,
      });
    }

    const updated = await prisma.event.update({
      where: { event_id: id },
      data: { status: 'pending_approval' },
      include: { club: { include: { mentor: true } } },
    });

    const isResubmission = existing.status === 'changes_requested';
    const stage = isResubmission ? 'resubmitted' : 'submitted';
    const title = isResubmission ? 'Proposal Resubmitted with Revisions' : 'Proposal Submitted for Review';

    await prisma.proposalTimeline.create({
      data: {
        event_id: id,
        stage,
        title,
        description: `Proposal forwarded to faculty mentor for approval review with official template dossier.`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: req.user.role,
      },
    });

    const mentorId = updated.club?.mentor?.user_id;
    if (mentorId) {
      await prisma.notification.create({
        data: {
          user_id: mentorId,
          event_id: id,
          title: title,
          message: `${req.user.name} submitted "${updated.title}" for review.`,
        },
      });

      broadcastToUser(mentorId, 'PROPOSAL_SUBMITTED', {
        event_id: id,
        title: updated.title,
        status: 'pending_approval',
      });
    }

    broadcastToRole('admin', 'PROPOSAL_STATUS_CHANGED', {
      event_id: id,
      title: updated.title,
      status: 'pending_approval',
    });

    broadcastMetricsUpdate('all');

    return res.status(200).json({
      success: true,
      message: 'Proposal successfully submitted for faculty mentor review',
      event: updated,
    });
  } catch (error) {
    console.error('Submit Proposal Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit proposal: ' + error.message });
  }
});

// 9. POST /api/proposals/:id/review: Mentor review decision (Approve, Request Changes, Reject)
router.post('/:id/review', authenticateUser, checkRole('mentor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, remarks } = req.body;

    if (!['approve', 'request_changes', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision. Allowed values: 'approve', 'request_changes', 'reject'",
      });
    }

    if (decision === 'request_changes' && (!remarks || remarks.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer remarks are required when requesting changes.',
      });
    }

    const proposal = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        club: { include: { mentor: true, president: true } },
        creator: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (req.user.role === 'mentor' && proposal.club?.mentor_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the assigned mentor for this club',
      });
    }

    let newStatus = 'approved';
    let timelineStage = 'approved';
    let timelineTitle = 'Proposal Approved by Mentor';
    let notificationTitle = 'Event Proposal Approved';
    let notificationMsg = `Great news! Your event proposal "${proposal.title}" has been approved by ${req.user.name}.`;

    if (decision === 'request_changes') {
      newStatus = 'changes_requested';
      timelineStage = 'changes_requested';
      timelineTitle = 'Changes Requested by Mentor';
      notificationTitle = 'Changes Requested on Proposal';
      notificationMsg = `Mentor ${req.user.name} requested changes on "${proposal.title}": "${remarks}"`;
    } else if (decision === 'reject') {
      newStatus = 'rejected';
      timelineStage = 'rejected';
      timelineTitle = 'Proposal Rejected by Mentor';
      notificationTitle = 'Proposal Decision: Rejected';
      notificationMsg = `Mentor ${req.user.name} has not approved "${proposal.title}". Remarks: "${remarks || 'Does not align with campus schedule'}"`;
    }

    const updatedEvent = await prisma.event.update({
      where: { event_id: id },
      data: { status: newStatus },
    });

    await prisma.event_Approval.create({
      data: {
        event_id: id,
        mentor_id: req.user.user_id,
        status: newStatus,
        remarks: remarks?.trim() || null,
        reviewed_at: new Date(),
      },
    });

    await prisma.proposalTimeline.create({
      data: {
        event_id: id,
        stage: timelineStage,
        title: timelineTitle,
        description: `Decision recorded by ${req.user.name} (${req.user.role}).`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: req.user.role,
        remarks: remarks?.trim() || null,
      },
    });

    const targetUserId = proposal.creator.user_id;
    await prisma.notification.create({
      data: {
        user_id: targetUserId,
        event_id: id,
        title: notificationTitle,
        message: notificationMsg,
        channel: 'in_app',
      },
    });

    broadcastToUser(targetUserId, 'PROPOSAL_STATUS_CHANGED', {
      event_id: id,
      title: proposal.title,
      status: newStatus,
      decision,
      remarks: remarks?.trim() || null,
      reviewedBy: req.user.name,
      timestamp: new Date().toISOString(),
    });

    broadcastToUser(targetUserId, 'NOTIFICATION_NEW', {
      title: notificationTitle,
      message: notificationMsg,
      event_id: id,
    });

    broadcastToRole('admin', 'PROPOSAL_STATUS_CHANGED', {
      event_id: id,
      title: proposal.title,
      status: newStatus,
      decision,
      reviewedBy: req.user.name,
      timestamp: new Date().toISOString(),
    });

    broadcastMetricsUpdate('all');

    return res.status(200).json({
      success: true,
      message: `Proposal review decision recorded: ${newStatus}`,
      decision,
      status: newStatus,
    });
  } catch (error) {
    console.error('Review Proposal Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record review decision: ' + error.message });
  }
});

// 10. POST /api/proposals/:id/publish: Publish an approved event to live student feed
router.post('/:id/publish', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_highlighted } = req.body;

    const proposal = await prisma.event.findUnique({
      where: { event_id: id },
      include: { creator: true, club: true },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (proposal.status !== 'approved' && proposal.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: `Only proposals with 'approved' status can be published. Current status is '${proposal.status}'`,
      });
    }

    const updated = await prisma.event.update({
      where: { event_id: id },
      data: {
        status: 'published',
        is_highlighted: is_highlighted !== undefined ? Boolean(is_highlighted) : proposal.is_highlighted,
      },
    });

    await prisma.proposalTimeline.create({
      data: {
        event_id: id,
        stage: 'published',
        title: 'Event Published to Campus Feed',
        description: `Published by University Admin ${req.user.name}. Visible to all campus students.`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: 'admin',
      },
    });

    await prisma.notification.create({
      data: {
        user_id: proposal.created_by,
        event_id: id,
        title: 'Event Published!',
        message: `Your event "${proposal.title}" is now officially published on the student event portal.`,
      },
    });

    broadcastToAll('EVENT_PUBLISHED', {
      event_id: id,
      title: proposal.title,
      event_type: proposal.event_type,
      venue: proposal.venue,
      event_date: proposal.event_date,
      organizer: proposal.event_type === 'official' ? 'University Administration' : proposal.club?.club_name,
      publishedAt: new Date().toISOString(),
    });

    broadcastToUser(proposal.created_by, 'NOTIFICATION_NEW', {
      title: 'Event Published!',
      message: `Your event "${proposal.title}" has been published to the student portal.`,
      event_id: id,
    });

    broadcastMetricsUpdate('all');

    return res.status(200).json({
      success: true,
      message: 'Event published to student feed successfully',
      event: updated,
    });
  } catch (error) {
    console.error('Publish Event Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to publish event: ' + error.message });
  }
});

// 11. GET /api/proposals/:id/export-word: Export proposal dossier as real Word .docx
router.get('/:id/export-word', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        creator: true,
        club: { include: { mentor: true, president: true } },
        documents: true,
        timeline: { orderBy: { created_at: 'asc' } },
        approvals: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const wordBuffer = await generateWordProposalDossier(proposal);
    const sanitizedTitle = proposal.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}_Proposal_Dossier.docx"`);
    res.setHeader('Content-Length', wordBuffer.length);
    return res.send(wordBuffer);
  } catch (error) {
    console.error('Word Export Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Word export: ' + error.message });
  }
});

// 12. GET /api/proposals/:id/export-pdf: Export proposal dossier as real PDF
router.get('/:id/export-pdf', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await prisma.event.findUnique({
      where: { event_id: id },
      include: {
        creator: true,
        club: { include: { mentor: true, president: true } },
        documents: true,
        timeline: { orderBy: { created_at: 'asc' } },
        approvals: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const pdfBuffer = await generatePdfProposalDossier(proposal);
    const sanitizedTitle = proposal.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}_Proposal_Dossier.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Export Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF export: ' + error.message });
  }
});

export default router;
