# College Event Management System (CEMS) 🎓🚀

A full-stack, real-time, role-based web application for campus event governance, proposal approvals, document automation, and student participation.

![CEMS Architecture](https://img.shields.io/badge/Architecture-Full--Stack%20Live%20App-blue)
![Real-Time](https://img.shields.io/badge/WebSockets-Real--Time%20Sync-emerald)
![Database](https://img.shields.io/badge/Database-Prisma%20ORM%20%7C%20SQLite-indigo)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TailwindCSS%20%7C%20Recharts-cyan)

---

## 🌟 Core Features

1. **Standardized In-App Proposal Template & Document Editor**:
   * Common institutional event dossier template automatically prefilled with event name, budget, venue, capacity, and date.
   * Multi-tab rich in-app editor: Executive Summary, Itemized Budget Breakdown, Run-of-Show Agenda, Safety Protocols, and Live Preview.
   * Auto-attaches official proposal dossiers upon creation.

2. **Dedicated Per-Event Analytics Dashboard (`/events/:id/dashboard`)**:
   * Capacity utilization gauge & remaining spots.
   * Real-time registration velocity timeline.
   * Department and faculty breakdown charts.
   * Live searchable student attendee roster with ADT credentials.

3. **Dean's Virtual Certificate of Excellence**:
   * Dean (Admin) can confer official presidential certificates of excellence for successful events.
   * Customizable citation, recipient role, and Dean signature with unique serial numbers (`CEMS-CERT-YYYY-XXXXX`).
   * High-resolution landscape A4 PDF export with gold borders and university seals.
   * Honors & Certificates gallery in the President console.

4. **Real-Time Data Synchronization**:
   * Native WebSocket (`/ws`) event bus delivering instant updates for proposals, reviews, registrations, and metric summaries without manual page refreshes.
   * Interactive global toast notifications.

5. **Genuine Document Exports**:
   * Microsoft Word (`.docx`) official dossiers generated via `docx`.
   * High-definition PDF dossiers generated via `pdfkit`.

6. **Lag-Free Visual Dashboards**:
   * Optimized Recharts rendering with zero animation lag at 60 FPS.
   * Role-aware breadcrumb navigation and smart "Back to Dashboard" buttons across all pages.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Backend Setup & Database Initialization

```bash
cd backend
npm install

# Push database schema to local SQLite database
npx prisma db push

# Seed sample events & default accounts for all 4 roles
npm run seed

# Start Backend Server (Runs on port 5000 & ws://localhost:5000/ws)
npm run dev
```

### 2. Frontend React Setup

In a new terminal:

```bash
cd frontend
npm install

# Start Vite Frontend Dev Server (Runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Default Test Credentials

All accounts share the password: **`Password123!`**

| Role | Email | Password | Console Capabilities |
| :--- | :--- | :--- | :--- |
| **Dean / Admin** | `admin@college.edu` | `Password123!` | Final event publishing, system analytics, confer Dean's Certificates of Excellence |
| **Faculty Mentor** | `mentor@college.edu` | `Password123!` | Review proposals, approve or request modifications with remarks |
| **Club President** | `president@college.edu` | `Password123!` | Propose events, edit in-app standardized templates, view honors |
| **Student** | `student@college.edu` | `Password123!` | Browse verified campus feed, one-click RSVP, pass confirmation |

---

## 🧪 Automated End-to-End Verification

To run the automated verification test suites:

```bash
# Run full system E2E test (Auth, WebSockets, Proposal Lifecycle, Exports)
cd backend
node scripts/test-e2e.js

# Run enhancement verification test (Templates, Event Dashboards, Dean Certificates)
node scripts/test-enhancements.js
```

---

## 📁 Repository Structure

```
cems-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (Event, User, Certificate, Document, Registration)
│   │   └── seed.js               # Database seeder with sample events and users
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js           # Authentication & OTP sessions
│   │   │   ├── proposals.js      # Proposal governance & per-event dashboards
│   │   │   ├── certificates.js   # Dean certificate issuance & PDF export
│   │   │   ├── analytics.js      # Dashboard metric aggregation
│   │   │   └── documents.js      # Document uploads & version management
│   │   ├── utils/
│   │   │   ├── templateHelper.js # Institutional template generator
│   │   │   └── wordExport.js     # Word (.docx) dossier generation
│   │   ├── realtime.js           # WebSocket connection manager & broadcaster
│   │   └── server.js             # Express server entry point
│   └── scripts/
│       ├── test-e2e.js           # Comprehensive E2E test suite
│       └── test-enhancements.js  # Feature validation test suite
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── MentorDashboard.jsx
│   │   │   ├── PresidentDashboard.jsx
│   │   │   ├── EventDashboardPage.jsx
│   │   │   ├── ProposalDetailPage.jsx
│   │   │   └── EventFeedPage.jsx
│   │   ├── components/
│   │   │   ├── TemplateEditorModal.jsx # Multi-tab in-app proposal editor
│   │   │   ├── CertificateModal.jsx    # Dean virtual certificate studio
│   │   │   ├── ProposalTimeline.jsx    # Visual governance approval timeline
│   │   │   └── DocumentManager.jsx     # Document tracker & uploader
│   │   └── context/
│   │       ├── AuthContext.jsx
│   │       └── RealtimeContext.jsx     # WebSocket subscription hook
│   └── package.json
└── README.md
```
