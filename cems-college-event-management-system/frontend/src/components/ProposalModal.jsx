import React, { useState, useEffect } from 'react';
import { X, Send, Save, AlertCircle, FileText, Calendar, MapPin, DollarSign, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProposalModal({ proposal, club, isOpen, onClose, onProposalSaved }) {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    venue: '',
    budget: '',
    expected_attendees: '100',
    banner_image_url: '',
    registration_link: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(proposal);
  const wasChangesRequested = proposal?.status === 'changes_requested';

  useEffect(() => {
    if (proposal) {
      // Format datetime-local input string
      const d = new Date(proposal.event_date);
      const isoDate = !isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : '';

      setFormData({
        title: proposal.title || '',
        description: proposal.description || '',
        event_date: isoDate,
        venue: proposal.venue || '',
        budget: proposal.budget !== null && proposal.budget !== undefined ? String(proposal.budget) : '',
        expected_attendees: proposal.expected_attendees ? String(proposal.expected_attendees) : '100',
        banner_image_url: proposal.banner_image_url || '',
        registration_link: proposal.registration_link || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        event_date: '',
        venue: '',
        budget: '',
        expected_attendees: '100',
        banner_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        registration_link: '',
      });
    }
  }, [proposal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (submitForReview) => {
    if (!formData.title || !formData.description || !formData.event_date || !formData.venue) {
      setError('Please fill in all mandatory fields: Title, Description, Date, and Venue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      ...formData,
      club_id: club?.club_id || null,
      submit_for_review: submitForReview,
      resubmit: submitForReview && wasChangesRequested,
    };

    try {
      const url = isEditing ? `/api/proposals/${proposal.event_id}` : '/api/proposals';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onProposalSaved(data.event || data.proposal);
        onClose();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing
                ? wasChangesRequested
                  ? 'Revise Event Proposal (Addressing Mentor Remarks)'
                  : 'Edit Event Proposal'
                : 'Propose New College Event'}
            </h3>
            <p className="text-xs text-slate-500">
              {club ? `Affiliated Club: ${club.club_name}` : 'Institutional Proposal Workflow'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Changes requested notice */}
        {wasChangesRequested && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Faculty Mentor Instructions:
            </p>
            <p className="italic bg-white/70 p-2 rounded border border-amber-200">
              "{proposal.approvals?.[0]?.remarks || 'Please adjust the budget and venue arrangements.'}"
            </p>
          </div>
        )}

        {/* Standardized Template Notice */}
        <div className="mx-6 mt-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2.5">
          <FileText className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-950">
              Auto-Generated Standardized Institutional Template
            </p>
            <p className="text-blue-800 leading-snug mt-0.5">
              The common institutional event dossier is automatically generated and pre-filled with your event title, venue, budget breakdown, schedule, and capacity. You can edit any section directly in-app via the <strong>Edit Template</strong> button.
            </p>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 24-Hour AI & Web Hackathon: Hack The Future"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Detailed Description & Objectives *
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe event curriculum, target student audience, expected learning outcomes, and technical equipment needed..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Event Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Campus Venue *
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. CS Innovation Lab (Building 4, Room 302)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Estimated Budget ($)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. 2500"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Expected Attendees
              </label>
              <input
                type="number"
                min="1"
                value={formData.expected_attendees}
                onChange={(e) => setFormData({ ...formData, expected_attendees: e.target.value })}
                placeholder="100"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Banner Image URL
            </label>
            <input
              type="url"
              value={formData.banner_image_url}
              onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              External Registration Link (Optional)
            </label>
            <input
              type="url"
              value={formData.registration_link}
              onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
              placeholder="https://forms.gle/... (Leave blank for in-platform one-click registration)"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition"
          >
            Cancel
          </button>

          {!wasChangesRequested && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : wasChangesRequested ? (
              <>
                <Send className="w-3.5 h-3.5" />
                Resubmit for Mentor Review
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Submit for Mentor Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
