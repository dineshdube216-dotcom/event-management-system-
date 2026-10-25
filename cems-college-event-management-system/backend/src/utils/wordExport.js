import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
} from 'docx';

/**
 * Generates an official Word (.docx) Event Proposal Dossier buffer using standardized template content
 */
export async function generateWordProposalDossier(event) {
  const primaryColor = '1E3A8A'; // Deep Navy
  const secondaryColor = '047857'; // Forest Green
  const textColor = '1F2937'; // Slate-800

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Parse structured template if available
  let tpl = null;
  if (event.proposal_document_content) {
    try {
      tpl = typeof event.proposal_document_content === 'string'
        ? JSON.parse(event.proposal_document_content)
        : event.proposal_document_content;
    } catch (e) {
      console.warn('Failed to parse proposal_document_content in Word export:', e.message);
    }
  }

  // Budget Breakdown Table
  const budgetBreakdownRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Expenditure Item', bold: true })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Allocated Amount', bold: true })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Justification / Notes', bold: true })] })],
        }),
      ],
    }),
  ];

  const breakdownList = tpl?.budget_breakdown || [
    { item: 'Technical Infrastructure & A/V setup', amount: (event.budget || 2000) * 0.4, notes: 'Campus media facilities' },
    { item: 'Guest Speaker & Mentor Honorarium', amount: (event.budget || 2000) * 0.3, notes: 'External industry experts' },
    { item: 'Student Refreshments & Water', amount: (event.budget || 2000) * 0.3, notes: 'Campus cafeteria' },
  ];

  breakdownList.forEach((b) => {
    budgetBreakdownRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b.item })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${b.amount}`, bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b.notes || 'N/A' })] })] }),
        ],
      })
    );
  });

  // Schedule Agenda Table
  const scheduleRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Time Slot', bold: true })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Scheduled Activity / Milestone', bold: true })] })],
        }),
      ],
    }),
  ];

  const scheduleList = tpl?.schedule_agenda || [
    { time: '09:00 AM - 10:00 AM', activity: 'Registration & Participant Kit Distribution' },
    { time: '10:00 AM - 01:00 PM', activity: 'Inaugural Keynote & Technical Sessions' },
    { time: '01:00 PM - 02:00 PM', activity: 'Networking Lunch' },
    { time: '02:00 PM - 05:00 PM', activity: 'Demonstrations, Judging & Valedictory Ceremony' },
  ];

  scheduleList.forEach((s) => {
    scheduleRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.time, bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.activity })] })] }),
        ],
      })
    );
  });

  // Timeline rows
  const timelineRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Stage', bold: true })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Actor / Role', bold: true })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Timestamp', bold: true })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Remarks / Feedback', bold: true })] })],
        }),
      ],
    }),
  ];

  if (event.timeline && event.timeline.length > 0) {
    event.timeline.forEach((item) => {
      timelineRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item.title || item.stage, bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${item.actor_name || 'System'} (${item.actor_role || 'Automated'})` })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: formatDate(item.created_at) })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item.remarks || 'None recorded' })] })],
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Institutional Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'COLLEGE EVENT MANAGEMENT SYSTEM (CEMS)',
                bold: true,
                size: 24,
                color: primaryColor,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'OFFICE OF DEAN OF STUDENT AFFAIRS & CAMPUS GOVERNANCE COUNCIL',
                bold: true,
                size: 16,
                color: '4B5563',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Standardized University Event Proposal Dossier & Governance Record',
                italics: true,
                size: 16,
              }),
            ],
          }),

          // Event Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: event.title,
                bold: true,
                size: 32,
                color: primaryColor,
              }),
            ],
          }),

          // Metadata Grid Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Event ID:', bold: true })] })] }),
                  new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: event.event_id })] })] }),
                  new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Current Status:', bold: true })] })] }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: event.status.toUpperCase(),
                            bold: true,
                            color: event.status === 'approved' || event.status === 'published' ? '059669' : 'D97706',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Organizing Body:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: event.club?.club_name || 'University Administration' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Event Date:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatDate(event.event_date) })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Campus Venue:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: event.venue })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Budget Allocated:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${event.budget || 0}`, bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Lead Proposer:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: event.creator?.name || 'Club President' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Faculty Mentor:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: event.club?.mentor?.name || 'Prof. Alan Turing' })] })] }),
                ],
              }),
            ],
          }),

          // Section 1: Objectives & Overview
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
            children: [new TextRun({ text: '1. Event Objectives & Target Audience', bold: true, color: primaryColor })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: tpl?.educational_objectives || event.description })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Target Audience: ', bold: true }),
              new TextRun({ text: tpl?.target_audience || 'University undergraduate and postgraduate students.' }),
            ],
          }),

          // Section 2: Itemized Budget Breakdown
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: '2. Itemized Expenditure Breakdown', bold: true, color: primaryColor })],
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: budgetBreakdownRows }),

          // Section 3: Event Schedule & Agenda
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
            children: [new TextRun({ text: '3. Hourly Program Agenda & Schedule', bold: true, color: primaryColor })],
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: scheduleRows }),

          // Section 4: Safety & Power Backup Protocols
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
            children: [new TextRun({ text: '4. Venue Safety & Infrastructure Protocols', bold: true, color: primaryColor })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Safety & Crowd Protocol: ', bold: true }),
              new TextRun({ text: tpl?.safety_and_crowd_protocol || 'First-aid station coordinated with Campus Health Center. Fire safety clearance obtained.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Power & Equipment Backup: ', bold: true }),
              new TextRun({ text: tpl?.facility_and_power_backup || 'Campus Facilities contacted for auxiliary power backup during event hours.' }),
            ],
          }),

          // Section 5: Proposal Approval Workflow & Audit Trail
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
            children: [new TextRun({ text: '5. Governance Approval Audit Trail', bold: true, color: primaryColor })],
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: timelineRows }),

          // Sign-off section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '6. Official Sign-off & Certification', bold: true, color: primaryColor })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: tpl?.declaration || 'The organizing committee certifies that all event details comply with collegiate bylaws.',
                italics: true,
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Club President Sign-off:', bold: true })] }),
                      new Paragraph({ spacing: { before: 150 }, children: [new TextRun({ text: `Name: ${event.creator?.name || 'Alex Rivera'}` })] }),
                      new Paragraph({ children: [new TextRun({ text: `Status: PROPOSAL SUBMITTED (${formatDate(event.created_at)})`, bold: true, color: '059669' })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Faculty Mentor Review:', bold: true })] }),
                      new Paragraph({ spacing: { before: 150 }, children: [new TextRun({ text: `Name: ${event.club?.mentor?.name || 'Prof. Alan Turing'}` })] }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Decision: ${event.status.toUpperCase()}`,
                            bold: true,
                            color: event.status === 'approved' || event.status === 'published' ? '059669' : 'D97706',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
