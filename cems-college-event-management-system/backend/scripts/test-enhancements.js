import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

async function runEnhancementTests() {
  console.log('🧪 Verifying Enhanced Features: Standard Template, Dedicated Event Dashboard, & Dean Certificates...\n');

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

  // 1. Log in Admin and President
  const loginUser = async (email, password = 'Password123!') => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  };

  const adminAuth = await loginUser('admin@college.edu');
  const presidentAuth = await loginUser('president@college.edu');

  assert(adminAuth.success, 'Dean / Admin authenticated');
  assert(presidentAuth.success, 'Club President authenticated');

  // 2. Create a new proposal and verify standard template auto-population
  console.log('\n--- 1. Auto-Generated Standard Proposal Template ---');
  const newProposalRes = await fetch(`${BASE_URL}/api/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${presidentAuth.token}`,
    },
    body: JSON.stringify({
      title: 'Automated AI Robotics Summit 2026',
      description: 'Hands-on autonomous robotics showcase and workshop.',
      event_date: new Date(Date.now() + 86400000 * 20).toISOString(),
      venue: 'Robotics Engineering Pavilion',
      budget: 3500,
      expected_attendees: 180,
      submit_for_review: false,
    }),
  });

  const newProposalData = await newProposalRes.json();
  assert(newProposalData.success, 'President created new proposal');
  const eventId = newProposalData.event.event_id;

  // Verify template content auto-generated
  const templateRes = await fetch(`${BASE_URL}/api/proposals/${eventId}/document-template`, {
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
  });
  const templateData = await templateRes.json();

  assert(templateData.success && templateData.template, 'Auto-generated template retrieved from database');
  assert(templateData.template.executive_summary.event_title === 'Automated AI Robotics Summit 2026', 'Template prefilled with event title');
  assert(templateData.template.executive_summary.venue === 'Robotics Engineering Pavilion', 'Template prefilled with venue');
  assert(templateData.template.executive_summary.total_budget_requested === 3500, 'Template prefilled with budget');
  assert(Array.isArray(templateData.template.budget_breakdown) && templateData.template.budget_breakdown.length > 0, 'Template includes itemized budget breakdown');

  // 3. Edit the template in-app
  console.log('\n--- 2. In-App Template Editing & Persistence ---');
  const modifiedTemplate = {
    ...templateData.template,
    educational_objectives: 'Updated objective: Hands-on neural network robotic vision models.',
    budget_breakdown: [
      ...templateData.template.budget_breakdown,
      { item: 'Robotic Arm Hardware Kits', amount: 900, notes: '5 sets for students' },
    ],
  };

  const updateRes = await fetch(`${BASE_URL}/api/proposals/${eventId}/document-template`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${presidentAuth.token}`,
    },
    body: JSON.stringify({ template: modifiedTemplate }),
  });
  const updateData = await updateRes.json();
  assert(updateData.success, 'Template successfully updated and persisted');

  // Verify persisted changes
  const verifyTemplateRes = await fetch(`${BASE_URL}/api/proposals/${eventId}/document-template`, {
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
  });
  const verifyData = await verifyTemplateRes.json();
  assert(verifyData.template.educational_objectives.includes('neural network robotic vision models'), 'Updated educational objectives verified');

  // 4. Dedicated Event Analytics Dashboard
  console.log('\n--- 3. Dedicated Per-Event Analytics Dashboard ---');
  const eventDashboardRes = await fetch(`${BASE_URL}/api/proposals/${eventId}/event-dashboard`, {
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
  });
  const eventDashboardData = await eventDashboardRes.json();

  assert(eventDashboardData.success, 'Per-event analytics dashboard endpoint returned success');
  assert(eventDashboardData.analytics.capacity === 180, 'Accurate event capacity matching proposal target');
  assert(Array.isArray(eventDashboardData.analytics.velocityData), 'Includes registration velocity timeline data');
  assert(Array.isArray(eventDashboardData.analytics.departmentBreakdown), 'Includes department breakdown data');
  assert(Array.isArray(eventDashboardData.analytics.roster), 'Includes student attendee roster');

  // 5. Dean's Virtual Certificate of Excellence Issuance
  console.log('\n--- 4. Dean Virtual Certificate of Excellence ---');
  const certIssueRes = await fetch(`${BASE_URL}/api/certificates/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAuth.token}`,
    },
    body: JSON.stringify({
      event_id: eventId,
      recipient_id: presidentAuth.user.user_id,
      recipient_name: presidentAuth.user.name,
      recipient_role: 'Club President & Lead Organizer',
      event_title: 'Automated AI Robotics Summit 2026',
      club_name: 'Hack&Code Developers Club',
      citation: 'For stellar organization of the 2026 Autonomous AI Robotics Summit, engaging over 180 students in hands-on robotics engineering.',
      issued_by_name: 'Dr. Sarah Jenkins, Dean of Student Affairs',
    }),
  });

  const certData = await certIssueRes.json();
  assert(certData.success, 'Dean successfully issued Virtual Certificate of Excellence');
  assert(certData.certificate.certificate_number.includes('CERT-'), 'Certificate assigned unique serial number');
  const certId = certData.certificate.certificate_id;

  // 6. Download Certificate PDF
  console.log('\n--- 5. High-Resolution Certificate PDF Export ---');
  const pdfRes = await fetch(`${BASE_URL}/api/certificates/${certId}/export-pdf`);
  assert(pdfRes.status === 200, 'Certificate PDF download endpoint responded with 200 OK');
  assert(pdfRes.headers.get('content-type') === 'application/pdf', 'Served genuine application/pdf');
  const pdfBuffer = await pdfRes.arrayBuffer();
  assert(pdfBuffer.byteLength > 1000, `Generated valid PDF certificate (${pdfBuffer.byteLength} bytes)`);

  // 7. Verify Certificate on President & Event Dashboard
  console.log('\n--- 6. Certificate Verification across Views ---');
  const presidentCertsRes = await fetch(`${BASE_URL}/api/certificates`, {
    headers: { Authorization: `Bearer ${presidentAuth.token}` },
  });
  const presidentCerts = await presidentCertsRes.json();
  assert(presidentCerts.success && presidentCerts.certificates.some((c) => c.certificate_id === certId), 'Certificate appears in President Honors showcase');

  console.log('\n==================================================');
  console.log(`🎯 Enhancement Tests Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');
}

runEnhancementTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
