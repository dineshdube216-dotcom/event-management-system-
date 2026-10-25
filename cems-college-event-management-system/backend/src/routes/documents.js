import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { authenticateUser } from '../middleware/auth.js';
import { broadcastToAll, broadcastMetricsUpdate } from '../realtime.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// 1. POST /api/documents/upload/:eventId: Upload a document attachment for an event proposal
router.post('/upload/:eventId', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { document_type, version, remarks } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded' });
    }

    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        club: true,
      },
    });

    if (!event) {
      // Remove uploaded file if event doesn't exist
      fs.unlinkSync(file.path);
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Role check: Admin, creator, or club president
    const isOwner = event.created_by === req.user.user_id;
    const isPresident = event.club?.president_id === req.user.user_id;
    const isMentor = event.club?.mentor_id === req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isPresident && !isMentor && !isAdmin) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ success: false, message: 'Unauthorized to upload documents for this proposal' });
    }

    // Calculate version number if not provided (e.g., if previous documents exist)
    let docVersion = version || 'v1.0';
    if (!version) {
      const existingDocCount = await prisma.document.count({
        where: { event_id: eventId, document_type: document_type || 'proposal' },
      });
      if (existingDocCount > 0) {
        docVersion = `v1.${existingDocCount}`;
      }
    }

    const newDoc = await prisma.document.create({
      data: {
        event_id: eventId,
        file_name: file.filename,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        file_path: file.path,
        document_type: document_type || 'proposal',
        version: docVersion,
        status: isMentor || isAdmin ? 'approved' : 'submitted_for_review',
        uploaded_by: req.user.user_id,
        remarks: remarks || `Uploaded by ${req.user.name} (${req.user.role})`,
      },
      include: {
        uploader: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    // Add entry to ProposalTimeline
    await prisma.proposalTimeline.create({
      data: {
        event_id: eventId,
        stage: 'documents_uploaded',
        title: `Document Uploaded: ${file.originalname}`,
        description: `Version ${docVersion} (${(file.size / 1024).toFixed(1)} KB) uploaded by ${req.user.name}.`,
        actor_id: req.user.user_id,
        actor_name: req.user.name,
        actor_role: req.user.role,
        remarks: remarks || null,
      },
    });

    // Broadcast real-time document update
    broadcastToAll('DOCUMENT_UPDATED', {
      event_id: eventId,
      document: newDoc,
      uploadedBy: req.user.name,
    });

    broadcastMetricsUpdate('all');

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and registered successfully',
      document: newDoc,
    });
  } catch (error) {
    console.error('Document Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document: ' + error.message });
  }
});

// 2. GET /api/documents/download/:id: Secure download of an uploaded file
router.get('/download/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { document_id: id },
      include: {
        event: {
          include: { club: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
    return res.sendFile(document.file_path);
  } catch (error) {
    console.error('Document Download Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to download document: ' + error.message });
  }
});

// 3. PUT /api/documents/:id/status: Review / update document status (e.g. approve / request changes)
router.put('/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['draft', 'submitted_for_review', 'changes_requested', 'approved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid document status' });
    }

    const document = await prisma.document.findUnique({
      where: { document_id: id },
      include: { event: true },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const updated = await prisma.document.update({
      where: { document_id: id },
      data: {
        status,
        ...(remarks && { remarks }),
      },
      include: {
        uploader: true,
      },
    });

    broadcastToAll('DOCUMENT_UPDATED', {
      event_id: document.event_id,
      document_id: id,
      status,
      updatedBy: req.user.name,
    });

    return res.status(200).json({
      success: true,
      message: 'Document status updated',
      document: updated,
    });
  } catch (error) {
    console.error('Update Document Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update document status: ' + error.message });
  }
});

export default router;
