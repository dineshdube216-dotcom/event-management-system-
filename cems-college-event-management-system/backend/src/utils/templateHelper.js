/**
 * Helper to generate and maintain standardized official event proposal templates
 */

export function generateDefaultProposalTemplate(event, club, creator, mentor) {
  const budget = parseFloat(event.budget) || 2500;
  
  // Reasonable default budget split
  const item1 = Math.round(budget * 0.35);
  const item2 = Math.round(budget * 0.25);
  const item3 = Math.round(budget * 0.25);
  const item4 = Math.max(0, Math.round(budget - (item1 + item2 + item3)));

  return {
    meta: {
      template_version: '2026.1',
      template_name: 'CEMS Official University Event Proposal Dossier',
      generated_at: new Date().toISOString(),
    },
    executive_summary: {
      event_title: event.title,
      organizing_club: club?.club_name || 'Independent Student Committee',
      club_category: club?.category || 'Technical & Professional',
      president_name: creator?.name || 'Club President',
      president_email: creator?.email || 'president@college.edu',
      president_department: creator?.department || 'Engineering & Technology',
      mentor_name: mentor?.name || club?.mentor?.name || 'Prof. Alan Turing',
      mentor_department: mentor?.department || club?.mentor?.department || 'Faculty Governance Council',
      target_date: event.event_date ? new Date(event.event_date).toISOString() : new Date().toISOString(),
      venue: event.venue || 'Campus Auditorium Hall',
      expected_attendees: event.expected_attendees || 100,
      total_budget_requested: budget,
    },
    educational_objectives:
      event.description ||
      'This event aims to enrich campus technical culture, provide practical skill development, and foster collaboration among students across disciplines.',
    target_audience:
      'Open to all undergraduate and postgraduate students of engineering, sciences, and management with active student ADT credentials.',
    budget_breakdown: [
      { item: 'Technical Audio/Visual Setup & High-Speed Network', amount: item1, notes: 'Campus media support' },
      { item: 'Guest Speakers & Faculty Mentors Honorarium', amount: item2, notes: 'External industry experts' },
      { item: 'Participant Refreshments, Water & Healthy Snacks', amount: item3, notes: 'Approved campus caterer' },
      { item: 'Trophies, Winner Grants & Certificate Prints', amount: item4, notes: 'Top 3 winning teams' },
    ],
    schedule_agenda: [
      { time: '09:00 AM - 09:30 AM', activity: 'Registration & Welcome Kit Distribution' },
      { time: '09:30 AM - 10:30 AM', activity: 'Inaugural Address & Keynote Briefing' },
      { time: '10:30 AM - 01:00 PM', activity: 'Interactive Session / Competitive Sprint Part 1' },
      { time: '01:00 PM - 02:00 PM', activity: 'Networking Lunch Break' },
      { time: '02:00 PM - 04:30 PM', activity: 'Project Demonstrations & Evaluation' },
      { time: '04:30 PM - 05:30 PM', activity: 'Valedictory & Awards Presentation' },
    ],
    safety_and_crowd_protocol:
      'Campus Security notified for entry checkpoint management. First-aid team standing by. Fire exit paths cleared and inspected.',
    facility_and_power_backup:
      'Dual power generator backup reserved through campus facilities management to ensure zero downtime.',
    declaration:
      'We, the student organizing committee, certify that this event will adhere strictly to all university codes of conduct, safety mandates, and budget policies.',
  };
}
