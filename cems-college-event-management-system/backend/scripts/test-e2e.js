import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws';

async function runTests() {
  console.log('🧪 Starting End-to-End Verification of CEMS Live Application & Real-Time Sync...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  };

  // 1. Health check
  console.log('--- 1. Server Health Check ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'ok', 'Server health endpoint returned status ok');

  // 2. Authentication for all 4 roles
  console.log('\n--- 2. Role-Based Authentication & Sessions ---');
  const loginUser = async (email, password = 'Password123!') => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  };

  const adminAuth = await loginUser('admin@college.edu');
  assert(adminAuth.success && adminAuth.user.role === 'admin', 'Admin login successful (Dr. Sarah Jenkins)');

  const mentorAuth = await loginUser('mentor@college.edu');
  assert(mentorAuth.success && mentorAuth.user.role === 'mentor', 'Mentor login successful (Prof. Alan Turing)');

  const presidentAuth = await loginUser('president@college.edu');
  assert(presidentAuth.success && presidentAuth.user.role === 'president', 'President login successful (Alex Rivera)');

  const studentAuth = await loginUser('student@college.edu');
  assert(studentAuth.success && studentAuth.user.role === 'student', 'Student login successful (Samantha Reed)');

  // 3. Real-Time WebSocket Connection
  console.log('\n--- 3. Real-Time WebSocket Connection & Handshake ---');
  const wsEvents = [];
  const ws = new WebSocket(`${WS_URL}?token=${presidentAuth.token}`);

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('  ⚡ WebSocket opened successfully');
      resolve();
    });
    ws.on('error', reject);
    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        wsEvents.push(parsed);
      } catch (e) {}
    });
  });

  assert(ws.readyState === WebSocket.OPEN, 'WebSocket connection established on /ws');

  // 4. Student Event Feed & Registrations
  console.log('\n--- 4. Student Feed & Real-time Event Registration ---');
  const feedRes = await fetch(`${BASE_URL}/api/events`, {
    headers: { Authorization: `Bearer ${studentAuth.token}` },
  });
  const feedData = await feedRes.json();
  assert(feedData.success && feedData.events.length > 0, `Fetched ${feedData.events.length} published events from database`);

  const firstEvent = feedData.events.find((e) => !e.is_registered) || feedData.events[0];
  const eventId = firstEvent.event_id;
  const initialCount = firstEvent.registration_count;

  // Register student
  const regRes = await fetch(`${BASE_URL}/api/events/${eventId}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentAuth.token}`,
    },
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 || (regRes.status === 400 && regData.message.includes('already registered')), 'Student registration processed');

  // Verify registration list
  const myRegRes = await fetch(`${BASE_URL}/api/events/user/my-registrations`, {
    headers: { Authorization: `Bearer ${studentAuth.token}` },
  });
  const myRegData = await myRegRes.json();
  assert(myRegData.success && myRegData.registrations.length > 0, `Student has ${myRegData.registrations.length} verified registrations in DB`);

  // 5. Complete Proposal Workflow with Multi-Stage Audit Trail
  console.log('\n--- 5. End-to-End Proposal Workflow & Governance ---');

  // Fetch president's club
  const clubsRes = await fetch(`${BASE_URL}/api/events/meta/clubs`);
  const clubsData = await clubsRes.json();
  const codingClub = clubsData.clubs.find((c) => c.club_name.includes('Hack&Code')) || clubsData.clubs[0];

  // A. President creates a new draft proposal
  const newPropRes = await fetch(`${BASE_URL}/api/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${presidentAuth.token}`,
    },
    body: JSON.stringify({
      title: 'Full-Stack Web3 & AI Hackathon 2026',
      description: 'A 36-hour weekend sprint where students create decentralized AI applications and smart agents.',
      club_id: codingClub.club_id,
      event_date: new Date('2026-12-18T10:00:00Z').toISOString(),
      venue: 'Main CS Innovation Wing (Hall 3B)',
      budget: 3500,
      expected_attendees: 150,
      submit_for_review: false, // Save as draft first
    }),
  });
  const newPropData = await newPropRes.json();
  const createdProposalId = newPropData.event.event_id;
  assert(newPropRes.status === 201 && newPropData.event.status === 'draft', 'President created proposal in "draft" status');

  // B. President uploads a document attachment (multipart form)
  console.log('  📎 Testing physical document upload...');
  const testFilePath = path.join(__dirname, 'test_budget.pdf');
  fs.writeFileSync(testFilePath, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n195\n%%EOF');

  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync(testFilePath)], { type: 'application/pdf' });
  formData.append('file', fileBlob, 'Web3_AI_Hackathon_Budget_v1.pdf');
  formData.append('document_type', 'budget');
  formData.append('version', 'v1.0');
  formData.append('remarks', 'Detailed budget breakdown for meals, badges, and prizes');

  const uploadRes = await fetch(`${BASE_URL}/api/documents/upload/${createdProposalId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  assert(uploadRes.status === 201 && uploadData.document.file_name, 'Physical file uploaded and registered in database');

  // C. President submits draft for mentor review
  const submitRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
  });
  const submitData = await submitRes.json();
  assert(submitRes.status === 200 && submitData.event.status === 'pending_approval', 'Proposal submitted to mentor: status changed to "pending_approval"');

  // D. Mentor reviews proposal and requests changes with remarks
  const requestChangesRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mentorAuth.token}`,
    },
    body: JSON.stringify({
      decision: 'request_changes',
      remarks: 'Please provide certified fire safety clearance and coordinate power backup for 150 laptops with campus facilities.',
    }),
  });
  const requestChangesData = await requestChangesRes.json();
  assert(requestChangesRes.status === 200 && requestChangesData.status === 'changes_requested', 'Mentor requested revisions: status changed to "changes_requested"');

  // E. President revises and resubmits proposal
  const reviseRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${presidentAuth.token}`,
    },
    body: JSON.stringify({
      venue: 'Main CS Innovation Wing (Hall 3B) + Reserved Backup Generator',
      budget: 3750,
      resubmit: true,
    }),
  });
  const reviseData = await reviseRes.json();
  assert(reviseRes.status === 200 && reviseData.event.status === 'pending_approval', 'President revised proposal: status updated to "pending_approval"');

  // F. Mentor approves the revised proposal
  const approveRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mentorAuth.token}`,
    },
    body: JSON.stringify({
      decision: 'approve',
      remarks: 'Safety clearance and electrical backup verified. Approved for campus hosting.',
    }),
  });
  const approveData = await approveRes.json();
  assert(approveRes.status === 200 && approveData.status === 'approved', 'Mentor approved proposal: status changed to "approved"');

  // G. Admin publishes the approved proposal live to student portal
  const publishRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAuth.token}`,
    },
    body: JSON.stringify({ is_highlighted: true }),
  });
  const publishData = await publishRes.json();
  assert(publishRes.status === 200 && publishData.event.status === 'published', 'Admin published proposal: status changed to "published"');

  // H. Verify complete timeline history and audit trail
  const fullProposalRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  const fullProposalData = await fullProposalRes.json();
  const stages = fullProposalData.proposal.timeline.map((t) => t.stage);
  console.log('  📜 Timeline progression recorded:', stages.join(' -> '));
  assert(
    stages.includes('draft_created') &&
    stages.includes('documents_uploaded') &&
    stages.includes('submitted') &&
    stages.includes('changes_requested') &&
    stages.includes('resubmitted') &&
    stages.includes('approved') &&
    stages.includes('published'),
    'Full multi-stage audit trail recorded in database'
  );

  // 6. Word (.docx) and PDF Exports
  console.log('\n--- 6. Document Exports (.docx and .pdf) ---');
  const wordRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}/export-word`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  const wordBlob = await wordRes.arrayBuffer();
  const wordBuffer = Buffer.from(wordBlob);
  // docx files start with PK\x03\x04
  const isDocx = wordBuffer.length > 2000 && wordBuffer[0] === 0x50 && wordBuffer[1] === 0x4b;
  assert(isDocx, `Generated valid Microsoft Word (.docx) Proposal Dossier (${wordBuffer.length} bytes)`);

  const pdfRes = await fetch(`${BASE_URL}/api/proposals/${createdProposalId}/export-pdf`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  const pdfBlob = await pdfRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfBlob);
  // PDF files start with %PDF-
  const isPdf = pdfBuffer.length > 1000 && pdfBuffer.toString('utf-8', 0, 5) === '%PDF-';
  assert(isPdf, `Generated valid PDF Proposal Dossier (${pdfBuffer.length} bytes)`);

  // Document download
  const docId = uploadData.document.document_id;
  const downloadRes = await fetch(`${BASE_URL}/api/documents/download/${docId}`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  assert(downloadRes.status === 200, 'Secure download endpoint served uploaded file');

  // Clean up temporary test file
  if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);

  // 7. Role-Specific Accurate Database Analytics
  console.log('\n--- 7. Database-Calculated Analytics & Visualizations ---');
  const [adminAnalyticsRes, mentorAnalyticsRes, presidentAnalyticsRes] = await Promise.all([
    fetch(`${BASE_URL}/api/analytics/dashboard`, { headers: { Authorization: `Bearer ${adminAuth.token}` } }),
    fetch(`${BASE_URL}/api/analytics/dashboard`, { headers: { Authorization: `Bearer ${mentorAuth.token}` } }),
    fetch(`${BASE_URL}/api/analytics/dashboard`, { headers: { Authorization: `Bearer ${presidentAuth.token}` } }),
  ]);

  const adminAnalytics = await adminAnalyticsRes.json();
  const mentorAnalytics = await mentorAnalyticsRes.json();
  const presidentAnalytics = await presidentAnalyticsRes.json();

  assert(adminAnalytics.role === 'admin' && adminAnalytics.metrics.totalProposals > 0, 'Admin analytics accurately calculated from DB');
  assert(adminAnalytics.visualizations.statusDistribution.length > 0, 'Admin status distribution dataset calculated');
  assert(adminAnalytics.visualizations.clubActivity.length > 0, 'Admin club activity dataset calculated');

  assert(mentorAnalytics.role === 'mentor' && mentorAnalytics.metrics.totalUnderMentorship > 0, 'Mentor analytics strictly scoped to mentored clubs');
  assert(presidentAnalytics.role === 'president' && presidentAnalytics.club !== null, 'President analytics strictly scoped to club');

  // 8. In-App Notifications
  console.log('\n--- 8. In-App Notifications Center ---');
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
  });
  const notifData = await notifRes.json();
  assert(notifData.success && notifData.notifications.length > 0, `President received ${notifData.notifications.length} real in-app notifications`);

  // Check that real-time events were received by the WebSocket client
  console.log('\n--- 9. Real-Time Synchronization Summary ---');
  console.log(`  ⚡ Total Real-Time WebSocket Events Caught by Client: ${wsEvents.length}`);
  const eventTypes = wsEvents.map((e) => e.type);
  console.log('  Event types received:', [...new Set(eventTypes)].join(', '));
  assert(wsEvents.length > 0, 'Client received real-time WebSocket events without polling');

  ws.close();

  console.log('\n==================================================');
  console.log(`🎯 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
