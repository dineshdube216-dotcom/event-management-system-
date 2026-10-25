import PDFDocument from 'pdfkit';

/**
 * Generates an official PDF Event Proposal Dossier buffer
 */
export function generatePdfProposalDossier(event) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primary = '#1E3A8A'; // Navy
      const accent = '#047857'; // Green
      const muted = '#6B7280';
      const text = '#1F2937';

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold')
        .text('COLLEGE EVENT MANAGEMENT SYSTEM', 55, 52, { align: 'left' });
      doc.fontSize(10).font('Helvetica')
        .text('Office of Dean of Student Affairs & Faculty Council', 55, 74);
      doc.fontSize(9).font('Helvetica-Bold')
        .text('OFFICIAL EVENT PROPOSAL DOSSIER', 350, 65, { align: 'right' });

      doc.moveDown(3);

      // Event Title & Badge
      const currentY = 120;
      doc.fillColor(primary).fontSize(20).font('Helvetica-Bold')
        .text(event.title, 40, currentY, { width: 400 });

      // Status Badge
      const statusText = (event.status || 'DRAFT').toUpperCase();
      const statusColor = event.status === 'approved' || event.status === 'published' ? '#059669' : (event.status === 'changes_requested' ? '#D97706' : '#2563EB');
      
      doc.roundedRect(440, currentY, 115, 24, 4).fill(statusColor);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
        .text(statusText, 440, currentY + 6, { width: 115, align: 'center' });

      doc.moveDown(2);

      // Metadata Table Box
      const metaY = doc.y + 10;
      doc.rect(40, metaY, 515, 110).fill('#F8FAFC');
      doc.rect(40, metaY, 515, 110).stroke('#CBD5E1');

      doc.fillColor(text).fontSize(9);
      
      // Column 1
      doc.font('Helvetica-Bold').text('Event ID:', 55, metaY + 15);
      doc.font('Helvetica').text(event.event_id, 130, metaY + 15);

      doc.font('Helvetica-Bold').text('Organizing Body:', 55, metaY + 35);
      doc.font('Helvetica').text(event.club?.club_name || 'University Administration', 150, metaY + 35);

      doc.font('Helvetica-Bold').text('Event Type:', 55, metaY + 55);
      doc.font('Helvetica').text((event.event_type || 'Club').toUpperCase(), 130, metaY + 55);

      doc.font('Helvetica-Bold').text('Proposer / Lead:', 55, metaY + 75);
      doc.font('Helvetica').text(event.creator?.name || 'Club President', 150, metaY + 75);

      // Column 2
      doc.font('Helvetica-Bold').text('Event Date:', 300, metaY + 15);
      doc.font('Helvetica').text(new Date(event.event_date).toLocaleString(), 375, metaY + 15);

      doc.font('Helvetica-Bold').text('Venue:', 300, metaY + 35);
      doc.font('Helvetica').text(event.venue, 375, metaY + 35);

      doc.font('Helvetica-Bold').text('Budget Allocated:', 300, metaY + 55);
      doc.font('Helvetica').text(`$${event.budget || 0}`, 410, metaY + 55);

      doc.font('Helvetica-Bold').text('Faculty Mentor:', 300, metaY + 75);
      doc.font('Helvetica').text(event.club?.mentor?.name || 'Prof. Alan Turing', 390, metaY + 75);

      doc.y = metaY + 130;

      // Section 1: Description
      doc.fillColor(primary).fontSize(13).font('Helvetica-Bold')
        .text('1. Event Description & Objectives', 40, doc.y);
      doc.moveDown(0.5);
      doc.fillColor(text).fontSize(10).font('Helvetica')
        .text(event.description || 'No detailed description provided.', { width: 515, lineGap: 3 });

      doc.moveDown(1.5);

      // Section 2: Visual Workflow Timeline
      doc.fillColor(primary).fontSize(13).font('Helvetica-Bold')
        .text('2. Proposal Approval Timeline & Audit Trail', 40, doc.y);
      doc.moveDown(0.5);

      const timelineY = doc.y;
      doc.rect(40, timelineY, 515, 20).fill('#E2E8F0');
      doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
      doc.text('Stage', 45, timelineY + 5);
      doc.text('Actor / Role', 160, timelineY + 5);
      doc.text('Timestamp', 280, timelineY + 5);
      doc.text('Remarks / Review Notes', 390, timelineY + 5);

      let currentTLY = timelineY + 22;
      doc.font('Helvetica').fontSize(8.5);

      if (event.timeline && event.timeline.length > 0) {
        event.timeline.forEach((item, idx) => {
          if (currentTLY > 720) {
            doc.addPage();
            currentTLY = 40;
          }
          if (idx % 2 === 1) {
            doc.rect(40, currentTLY - 2, 515, 18).fill('#F8FAFC');
          }
          doc.fillColor(text);
          doc.font('Helvetica-Bold').text(item.title || item.stage, 45, currentTLY);
          doc.font('Helvetica').text(`${item.actor_name || 'System'} (${item.actor_role || 'Auto'})`, 160, currentTLY, { width: 110, ellipsis: true });
          doc.text(new Date(item.created_at).toLocaleDateString(), 280, currentTLY);
          doc.text(item.remarks || '-', 390, currentTLY, { width: 160, ellipsis: true });
          currentTLY += 20;
        });
      } else {
        doc.fillColor(muted).text('No audit timeline events logged.', 45, currentTLY);
        currentTLY += 20;
      }

      doc.y = currentTLY + 15;

      // Section 3: Document Attachments
      doc.fillColor(primary).fontSize(13).font('Helvetica-Bold')
        .text('3. Attached Supporting Documents', 40, doc.y);
      doc.moveDown(0.5);

      const docsHeaderY = doc.y;
      doc.rect(40, docsHeaderY, 515, 20).fill('#E2E8F0');
      doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
      doc.text('Document Name', 45, docsHeaderY + 5);
      doc.text('Type', 250, docsHeaderY + 5);
      doc.text('Version', 340, docsHeaderY + 5);
      doc.text('Review Status', 420, docsHeaderY + 5);

      let currentDocY = docsHeaderY + 22;
      doc.font('Helvetica').fontSize(8.5);

      if (event.documents && event.documents.length > 0) {
        event.documents.forEach((d, idx) => {
          if (currentDocY > 720) {
            doc.addPage();
            currentDocY = 40;
          }
          if (idx % 2 === 1) {
            doc.rect(40, currentDocY - 2, 515, 18).fill('#F8FAFC');
          }
          doc.fillColor(text);
          doc.text(d.original_name || d.file_name, 45, currentDocY, { width: 200, ellipsis: true });
          doc.text((d.document_type || 'General').toUpperCase(), 250, currentDocY);
          doc.text(d.version || 'v1.0', 340, currentDocY);
          const docStatusColor = d.status === 'approved' ? '#059669' : (d.status === 'changes_requested' ? '#D97706' : '#4B5563');
          doc.fillColor(docStatusColor).font('Helvetica-Bold').text((d.status || 'DRAFT').toUpperCase(), 420, currentDocY);
          currentDocY += 20;
        });
      } else {
        doc.fillColor(muted).text('No supporting files uploaded.', 45, currentDocY);
        currentDocY += 20;
      }

      doc.y = currentDocY + 20;

      // Section 4: Sign-off & Verification box
      if (doc.y > 660) {
        doc.addPage();
        doc.y = 50;
      }

      const signY = doc.y;
      doc.rect(40, signY, 515, 75).stroke('#CBD5E1');
      doc.fillColor(text).fontSize(9);
      doc.font('Helvetica-Bold').text('Digitally Certified Approval:', 55, signY + 12);
      doc.font('Helvetica').text(`This proposal was reviewed via CEMS Role-Based Governance.`, 55, signY + 26);
      doc.font('Helvetica-Oblique').text(`Faculty Mentor: ${event.club?.mentor?.name || 'Prof. Alan Turing'} | Status: ${statusText}`, 55, signY + 40);
      doc.text(`Generated on: ${new Date().toLocaleString()} (Authenticated)`, 55, signY + 54);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
