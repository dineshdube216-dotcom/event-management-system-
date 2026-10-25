import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive CEMS database seeding...');

  // Ensure uploads folder exists and write initial sample documents
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleBudgetPdf = path.join(uploadsDir, 'sample_budget_breakdown.pdf');
  const sampleDocx = path.join(uploadsDir, 'sample_proposal_overview.docx');
  const sampleSafetyPdf = path.join(uploadsDir, 'sample_safety_permit.pdf');

  if (!fs.existsSync(sampleBudgetPdf)) {
    fs.writeFileSync(sampleBudgetPdf, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n195\n%%EOF');
  }
  if (!fs.existsSync(sampleDocx)) {
    fs.writeFileSync(sampleDocx, 'PK\x03\x04\x14\x00\x00\x00\x08\x00Sample CEMS Proposal Document\n');
  }
  if (!fs.existsSync(sampleSafetyPdf)) {
    fs.writeFileSync(sampleSafetyPdf, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n195\n%%EOF');
  }

  // Clean existing data cleanly
  await prisma.document.deleteMany();
  await prisma.proposalTimeline.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.oTP_Verification.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event_Approval.deleteMany();
  await prisma.event.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();

  // Create Users with all 4 roles
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'admin@college.edu',
      password_hash: hashedPassword,
      role: 'admin',
      department: 'Dean of Student Affairs',
      phone_no: '+1 (555) 019-2831',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      email_verified: true,
    },
  });

  const mentor = await prisma.user.create({
    data: {
      name: 'Prof. Alan Turing',
      email: 'mentor@college.edu',
      password_hash: hashedPassword,
      role: 'mentor',
      department: 'Computer Science & Engineering',
      phone_no: '+1 (555) 018-4421',
      photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      email_verified: true,
    },
  });

  const president = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'president@college.edu',
      password_hash: hashedPassword,
      role: 'president',
      department: 'Computer Science & Engineering',
      adt_no: 'ADT2024CS042',
      phone_no: '+1 (555) 012-9988',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      email_verified: true,
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Samantha Reed',
      email: 'student@college.edu',
      password_hash: hashedPassword,
      role: 'student',
      department: 'Information Technology',
      adt_no: 'ADT2024IT108',
      phone_no: '+1 (555) 014-7722',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      email_verified: true,
    },
  });

  console.log('✅ Core users created: admin, mentor, president, student');

  // Create Clubs
  const codingClub = await prisma.club.create({
    data: {
      club_name: 'Hack&Code Developers Club',
      description: 'Campus hub for software engineers, competitive programmers, and open-source contributors.',
      category: 'Technical',
      mentor_id: mentor.user_id,
      president_id: president.user_id,
    },
  });

  const roboticsClub = await prisma.club.create({
    data: {
      club_name: 'Robotics & Automation Society',
      description: 'Fostering hands-on mechatronics, drone navigation, and autonomous hardware systems.',
      category: 'Engineering',
      mentor_id: mentor.user_id,
    },
  });

  const artsClub = await prisma.club.create({
    data: {
      club_name: 'Fine Arts & Cultural Club',
      description: 'Celebrating campus music, drama, visual art, and creative expression.',
      category: 'Cultural',
      mentor_id: mentor.user_id,
    },
  });

  console.log('✅ Clubs created with mentor & president affiliations');

  // 1. Published Official Event
  const officialEvent = await prisma.event.create({
    data: {
      title: 'Annual Grand Tech Symposium 2026',
      description: 'The flagship university technology conference featuring keynote talks by industry leaders from Google and OpenAI, student capstone showcases, and \$10,000 innovation grant awards.',
      created_by: admin.user_id,
      club_id: null,
      status: 'published',
      event_type: 'official',
      event_date: new Date('2026-11-15T09:00:00Z'),
      venue: 'Main University Auditorium & Exhibition Hall A',
      budget: 8500,
      expected_attendees: 500,
      banner_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      registration_link: 'https://forms.gle/tech-symposium-2026',
      is_highlighted: true,
    },
  });

  await prisma.proposalTimeline.createMany({
    data: [
      {
        event_id: officialEvent.event_id,
        stage: 'draft_created',
        title: 'Official Event Drafted',
        description: 'Initiated by Office of the Dean.',
        actor_name: admin.name,
        actor_role: 'admin',
        created_at: new Date('2026-08-01T10:00:00Z'),
      },
      {
        event_id: officialEvent.event_id,
        stage: 'approved',
        title: 'Executive Senate Approval',
        description: 'University budget committee approved funding.',
        actor_name: admin.name,
        actor_role: 'admin',
        created_at: new Date('2026-08-05T14:30:00Z'),
      },
      {
        event_id: officialEvent.event_id,
        stage: 'published',
        title: 'Official Event Published',
        description: 'Broadcasted to all student portals and campus calendar.',
        actor_name: admin.name,
        actor_role: 'admin',
        created_at: new Date('2026-08-10T09:00:00Z'),
      },
    ],
  });

  // 2. Published Club Event
  const publishedClubEvent = await prisma.event.create({
    data: {
      title: '24-Hour AI & Web Hackathon: Hack The Future',
      description: 'Build full-stack AI applications and autonomous agents in 24 hours. Includes complimentary meals, mentor office hours, and prize pools sponsored by top tech partners.',
      created_by: president.user_id,
      club_id: codingClub.club_id,
      status: 'published',
      event_type: 'club',
      event_date: new Date('2026-11-20T10:00:00Z'),
      venue: 'CS Innovation Lab (Building 4, Room 302)',
      budget: 3200,
      expected_attendees: 120,
      banner_image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      is_highlighted: false,
    },
  });

  await prisma.proposalTimeline.createMany({
    data: [
      {
        event_id: publishedClubEvent.event_id,
        stage: 'draft_created',
        title: 'Proposal Draft Created',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-08-15T11:00:00Z'),
      },
      {
        event_id: publishedClubEvent.event_id,
        stage: 'documents_uploaded',
        title: 'Budget and Venue Permits Attached',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-08-16T12:00:00Z'),
      },
      {
        event_id: publishedClubEvent.event_id,
        stage: 'submitted',
        title: 'Proposal Submitted to Mentor',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-08-17T09:30:00Z'),
      },
      {
        event_id: publishedClubEvent.event_id,
        stage: 'approved',
        title: 'Mentor Approved Proposal',
        actor_name: mentor.name,
        actor_role: 'mentor',
        remarks: 'Excellent technical curriculum and adequate lab space reserved. Approved without reservations.',
        created_at: new Date('2026-08-18T16:00:00Z'),
      },
      {
        event_id: publishedClubEvent.event_id,
        stage: 'published',
        title: 'Event Published to Campus Feed',
        actor_name: admin.name,
        actor_role: 'admin',
        created_at: new Date('2026-08-19T10:00:00Z'),
      },
    ],
  });

  await prisma.document.create({
    data: {
      event_id: publishedClubEvent.event_id,
      file_name: 'HackTheFuture_Proposal_v1.docx',
      original_name: 'HackTheFuture_Proposal_v1.docx',
      file_size: 45020,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_path: sampleDocx,
      document_type: 'proposal',
      version: 'v1.0',
      status: 'approved',
      uploaded_by: president.user_id,
      remarks: 'Official proposal brief with sponsor tiers',
    },
  });

  // 3. Pending Review Event (Waiting for Mentor Alan Turing review)
  const pendingEvent = await prisma.event.create({
    data: {
      title: 'Cloud Native & Microservices Bootcamp 2026',
      description: 'Intensive 2-day hands-on workshop covering Docker containerization, Kubernetes cluster management, CI/CD pipelines, and cloud observability.',
      created_by: president.user_id,
      club_id: codingClub.club_id,
      status: 'pending_approval',
      event_type: 'club',
      event_date: new Date('2026-11-28T09:30:00Z'),
      venue: 'Seminar Hall B, IT Complex',
      budget: 1800,
      expected_attendees: 80,
      banner_image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      is_highlighted: false,
    },
  });

  await prisma.proposalTimeline.createMany({
    data: [
      {
        event_id: pendingEvent.event_id,
        stage: 'draft_created',
        title: 'Proposal Draft Created',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-10-20T10:00:00Z'),
      },
      {
        event_id: pendingEvent.event_id,
        stage: 'documents_uploaded',
        title: 'Curriculum & Budget Uploaded',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-10-21T11:15:00Z'),
      },
      {
        event_id: pendingEvent.event_id,
        stage: 'submitted',
        title: 'Submitted for Mentor Review',
        description: 'Waiting for Prof. Alan Turing review and decision.',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-10-22T09:00:00Z'),
      },
    ],
  });

  await prisma.document.create({
    data: {
      event_id: pendingEvent.event_id,
      file_name: 'CloudBootcamp_Budget_v1.pdf',
      original_name: 'CloudBootcamp_Budget_v1.pdf',
      file_size: 102400,
      mime_type: 'application/pdf',
      file_path: sampleBudgetPdf,
      document_type: 'budget',
      version: 'v1.0',
      status: 'submitted_for_review',
      uploaded_by: president.user_id,
      remarks: 'AWS student credits and instructor honorarium breakdown',
    },
  });

  // 4. Changes Requested Event (Mentor Alan Turing requested revisions from Alex Rivera)
  const changesEvent = await prisma.event.create({
    data: {
      title: 'Inter-College Esports Championship 2026',
      description: 'Campus-wide gaming tournament featuring Valorant, Rocket League, and FIFA with live stage commentary and spectator lounge.',
      created_by: president.user_id,
      club_id: codingClub.club_id,
      status: 'changes_requested',
      event_type: 'club',
      event_date: new Date('2026-12-05T14:00:00Z'),
      venue: 'Campus Indoor Stadium & Media Arena',
      budget: 4500,
      expected_attendees: 300,
      banner_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      is_highlighted: false,
    },
  });

  await prisma.proposalTimeline.createMany({
    data: [
      {
        event_id: changesEvent.event_id,
        stage: 'draft_created',
        title: 'Proposal Draft Created',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-10-10T14:00:00Z'),
      },
      {
        event_id: changesEvent.event_id,
        stage: 'submitted',
        title: 'Submitted for Faculty Review',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-10-12T16:00:00Z'),
      },
      {
        event_id: changesEvent.event_id,
        stage: 'changes_requested',
        title: 'Changes Requested by Mentor',
        actor_name: mentor.name,
        actor_role: 'mentor',
        remarks: 'Please furnish a crowd management safety plan with Campus Security and clarify electricity load requirements for 50 gaming stations.',
        created_at: new Date('2026-10-15T11:30:00Z'),
      },
    ],
  });

  await prisma.event_Approval.create({
    data: {
      event_id: changesEvent.event_id,
      mentor_id: mentor.user_id,
      status: 'changes_requested',
      remarks: 'Please furnish a crowd management safety plan with Campus Security and clarify electricity load requirements for 50 gaming stations.',
      reviewed_at: new Date('2026-10-15T11:30:00Z'),
    },
  });

  await prisma.document.create({
    data: {
      event_id: changesEvent.event_id,
      file_name: 'Esports_Safety_Protocol_v1.pdf',
      original_name: 'Esports_Safety_Protocol_v1.pdf',
      file_size: 78500,
      mime_type: 'application/pdf',
      file_path: sampleSafetyPdf,
      document_type: 'venue_permit',
      version: 'v1.0',
      status: 'changes_requested',
      uploaded_by: president.user_id,
      remarks: 'Preliminary safety plan, awaiting revision',
    },
  });

  // 5. Draft Event
  const draftEvent = await prisma.event.create({
    data: {
      title: 'Open Source Summer Codefest 2027',
      description: 'A 4-week open-source mentorship program connecting student contributors with GitHub projects and upstream maintainers.',
      created_by: president.user_id,
      club_id: codingClub.club_id,
      status: 'draft',
      event_type: 'club',
      event_date: new Date('2027-01-15T10:00:00Z'),
      venue: 'Virtual & Campus Tech Hub',
      budget: 1200,
      expected_attendees: 150,
      banner_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    },
  });

  await prisma.proposalTimeline.create({
    data: {
      event_id: draftEvent.event_id,
      stage: 'draft_created',
      title: 'Draft Proposal Initialized',
      description: 'Work in progress by club president.',
      actor_name: president.name,
      actor_role: 'president',
      created_at: new Date('2026-10-22T15:00:00Z'),
    },
  });

  // 6. Approved Event (Ready for Admin Publishing)
  const approvedEvent = await prisma.event.create({
    data: {
      title: 'Autonomous Robotics & Drone Racing Championship',
      description: 'Spectacular multi-rotor drone races through illuminated obstacle courses, featuring autonomous obstacle avoidance and line-following bots.',
      created_by: president.user_id,
      club_id: roboticsClub.club_id,
      status: 'approved',
      event_type: 'club',
      event_date: new Date('2026-12-10T13:00:00Z'),
      venue: 'Campus Indoor Sports Complex Arena',
      budget: 5000,
      expected_attendees: 350,
      banner_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
    },
  });

  await prisma.proposalTimeline.createMany({
    data: [
      {
        event_id: approvedEvent.event_id,
        stage: 'draft_created',
        title: 'Proposal Draft Created',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-09-01T10:00:00Z'),
      },
      {
        event_id: approvedEvent.event_id,
        stage: 'submitted',
        title: 'Proposal Submitted',
        actor_name: president.name,
        actor_role: 'president',
        created_at: new Date('2026-09-05T11:00:00Z'),
      },
      {
        event_id: approvedEvent.event_id,
        stage: 'approved',
        title: 'Approved by Faculty Mentor',
        actor_name: mentor.name,
        actor_role: 'mentor',
        remarks: 'Safety nets and fire marshal permits verified. Approved for scheduling.',
        created_at: new Date('2026-09-10T14:00:00Z'),
      },
    ],
  });

  await prisma.event_Approval.create({
    data: {
      event_id: approvedEvent.event_id,
      mentor_id: mentor.user_id,
      status: 'approved',
      remarks: 'Safety nets and fire marshal permits verified. Approved for scheduling.',
      reviewed_at: new Date('2026-09-10T14:00:00Z'),
    },
  });

  // Seed sample registrations for Student Samantha Reed
  await prisma.registration.createMany({
    data: [
      { event_id: officialEvent.event_id, student_id: student.user_id },
      { event_id: publishedClubEvent.event_id, student_id: student.user_id },
    ],
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        user_id: mentor.user_id,
        event_id: pendingEvent.event_id,
        title: 'Proposal Awaiting Review',
        message: 'Alex Rivera submitted "Cloud Native & Microservices Bootcamp 2026" for your faculty review.',
        channel: 'in_app',
        is_read: false,
      },
      {
        user_id: president.user_id,
        event_id: changesEvent.event_id,
        title: 'Changes Requested on Proposal',
        message: 'Mentor Prof. Alan Turing requested revisions on "Inter-College Esports Championship 2026".',
        channel: 'in_app',
        is_read: false,
      },
      {
        user_id: student.user_id,
        event_id: officialEvent.event_id,
        title: 'Event Confirmed',
        message: 'Your registration for "Annual Grand Tech Symposium 2026" is verified.',
        channel: 'in_app',
        is_read: true,
      },
      {
        user_id: admin.user_id,
        event_id: approvedEvent.event_id,
        title: 'Proposal Ready for Publishing',
        message: '"Autonomous Robotics & Drone Racing Championship" was approved by mentor and is ready for publishing.',
        channel: 'in_app',
        is_read: false,
      },
    ],
  });

  console.log('🎉 Comprehensive database seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Test Accounts:');
  console.log('🔹 Admin:     admin@college.edu     / Password123!');
  console.log('🔹 Mentor:    mentor@college.edu    / Password123!');
  console.log('🔹 President: president@college.edu / Password123!');
  console.log('🔹 Student:   student@college.edu   / Password123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
