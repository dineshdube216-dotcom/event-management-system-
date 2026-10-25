import express from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../config/prisma.js';
import { authenticateUser } from '../middleware/auth.js';
import { broadcastToUser, broadcastToAll, broadcastMetricsUpdate } from '../realtime.js';

const router = express.Router();

// Helper to check role
const checkRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

// 1. GET /api/certificates: List certificates for current user or all for admin
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { user_id, role } = req.user;

    const where = role === 'admin' ? {} : { recipient_id: user_id };
    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        event: {
          select: {
            event_id: true,
            title: true,
            event_date: true,
            venue: true,
          },
        },
        recipient: {
          select: {
            name: true,
            email: true,
            department: true,
            adt_no: true,
            photo_url: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, count: certificates.length, certificates });
  } catch (err) {
    console.error('Fetch Certificates Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch certificates: ' + err.message });
  }
});

// 2. GET /api/certificates/event/:eventId: Get certificate issued for a specific event
router.get('/event/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: { event_id: eventId },
      include: {
        recipient: { select: { name: true, email: true, department: true } },
        issuer: { select: { name: true, email: true } },
      },
    });

    return res.status(200).json({ success: true, certificate });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. POST /api/certificates/issue: Dean/Admin issues a Virtual Certificate of Excellence
router.post('/issue', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const {
      event_id,
      recipient_id,
      recipient_name,
      recipient_role,
      event_title,
      club_name,
      citation,
      issued_by_name,
      certificate_number,
    } = req.body;

    if (!event_id || !recipient_id || !event_title) {
      return res.status(400).json({
        success: false,
        message: 'event_id, recipient_id, and event_title are required to issue a certificate.',
      });
    }

    // Generate unique cert number if not provided
    const certNum =
      certificate_number ||
      `CEMS-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const cert = await prisma.certificate.create({
      data: {
        event_id,
        recipient_id,
        recipient_name: recipient_name || 'Club President',
        recipient_role: recipient_role || 'Club President & Lead Organizer',
        event_title,
        club_name: club_name || 'Student Club',
        issued_by_id: req.user.user_id,
        issued_by_name: issued_by_name || `${req.user.name}, Dean of Student Affairs`,
        citation:
          citation ||
          'In recognition of outstanding student leadership, exemplary organizational execution, and meritorious service to the university community.',
        certificate_number: certNum,
      },
      include: {
        event: true,
        recipient: true,
      },
    });

    // Notify President
    await prisma.notification.create({
      data: {
        user_id: recipient_id,
        event_id,
        title: '🏆 Certificate of Excellence Awarded!',
        message: `Dean ${req.user.name} has awarded you an official Certificate of Leadership & Event Excellence for "${event_title}".`,
        channel: 'in_app',
      },
    });

    // Broadcast real-time event to president and all
    broadcastToUser(recipient_id, 'NOTIFICATION_NEW', {
      title: '🏆 Certificate of Excellence Awarded!',
      message: `You have received a Dean Certificate of Excellence for "${event_title}".`,
      event_id,
    });

    broadcastToUser(recipient_id, 'CERTIFICATE_AWARDED', {
      certificate: cert,
    });

    broadcastMetricsUpdate('all');

    return res.status(201).json({
      success: true,
      message: 'Official Virtual Certificate issued successfully',
      certificate: cert,
    });
  } catch (err) {
    console.error('Issue Certificate Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to issue certificate: ' + err.message });
  }
});

// 4. GET /api/certificates/:id/export-pdf: Export high-resolution official PDF certificate
router.get('/:id/export-pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const cert = await prisma.certificate.findUnique({
      where: { certificate_id: id },
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 30,
    });

    const buffers = [];
    doc.on('data', (c) => buffers.push(c));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${cert.certificate_number}_Certificate_of_Excellence.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    });

    // Outer and Inner Gold Borders
    doc.rect(20, 20, 802, 555).lineWidth(4).stroke('#B45309');
    doc.rect(28, 28, 786, 539).lineWidth(1.5).stroke('#D97706');
    doc.rect(34, 34, 774, 527).fill('#FFFDF8');

    // University Header
    doc.fillColor('#1E3A8A').fontSize(22).font('Helvetica-Bold')
      .text('COLLEGE OF ENGINEERING & TECHNOLOGY', 0, 65, { align: 'center' });

    doc.fillColor('#4B5563').fontSize(11).font('Helvetica')
      .text('OFFICE OF THE DEAN OF STUDENT AFFAIRS & CAMPUS LEADERSHIP', 0, 92, { align: 'center' });

    doc.moveDown(0.8);

    // Certificate Title Banner
    doc.fillColor('#B45309').fontSize(28).font('Helvetica-Bold')
      .text('CERTIFICATE OF LEADERSHIP & EXCELLENCE', 0, 125, { align: 'center' });

    doc.fillColor('#6B7280').fontSize(12).font('Helvetica-Oblique')
      .text('This is proudly presented and digitally certified to', 0, 165, { align: 'center' });

    // Recipient Name
    doc.fillColor('#1E3A8A').fontSize(32).font('Helvetica-Bold')
      .text(cert.recipient_name, 0, 205, { align: 'center' });

    // Underline
    doc.moveTo(250, 245).lineTo(592, 245).lineWidth(1.5).stroke('#D97706');

    // Recipient Role
    doc.fillColor('#374151').fontSize(13).font('Helvetica-Bold')
      .text(`${cert.recipient_role} • ${cert.club_name}`, 0, 255, { align: 'center' });

    // Citation Body
    doc.fillColor('#4B5563').fontSize(11).font('Helvetica')
      .text(
        cert.citation ||
          `In commendation of extraordinary campus leadership and exemplary orchestration of "${cert.event_title}", fostering academic innovation and high student engagement.`,
        120,
        290,
        { align: 'center', width: 602, lineGap: 4 }
      );

    // Event & Date Highlight
    doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold')
      .text(`Event: ${cert.event_title}`, 0, 350, { align: 'center' });

    // Signatures Section
    const sigY = 430;
    // Dean Sign-off
    doc.moveTo(140, sigY).lineTo(340, sigY).lineWidth(1).stroke('#9CA3AF');
    doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold')
      .text(cert.issued_by_name, 140, sigY + 8, { width: 200, align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
      .text('Dean of Student Affairs', 140, sigY + 24, { width: 200, align: 'center' });

    // Seal in Center
    doc.circle(421, sigY - 10, 32).lineWidth(2).stroke('#D97706');
    doc.fillColor('#B45309').fontSize(8).font('Helvetica-Bold')
      .text('OFFICIAL', 391, sigY - 20, { width: 60, align: 'center' });
    doc.text('UNIVERSITY', 391, sigY - 10, { width: 60, align: 'center' });
    doc.text('SEAL', 391, sigY, { width: 60, align: 'center' });

    // Faculty Council Sign-off
    doc.moveTo(502, sigY).lineTo(702, sigY).lineWidth(1).stroke('#9CA3AF');
    doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold')
      .text('Prof. Alan Turing', 502, sigY + 8, { width: 200, align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
      .text('Faculty Governance Council Mentor', 502, sigY + 24, { width: 200, align: 'center' });

    // Footer Serial Number
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
      .text(
        `Digital Certificate ID: ${cert.certificate_number} • Issue Date: ${new Date(
          cert.issue_date
        ).toLocaleDateString()} • Verified on CEMS Platform`,
        0,
        535,
        { align: 'center' }
      );

    doc.end();
  } catch (err) {
    console.error('PDF Certificate Export Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
