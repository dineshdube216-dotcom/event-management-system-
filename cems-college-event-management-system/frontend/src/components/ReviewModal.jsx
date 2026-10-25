import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ReviewModal({ proposal, isOpen, onClose, onReviewSubmitted }) {
  const { token } = useAuth();
  const [decision, setDecision] = useState('approve'); // 'approve' | 'request_changes' | 'reject'
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !proposal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (decision === 'request_changes' && (!remarks || remarks.trim() === '')) {
      setError('Please provide detailed feedback remarks explaining what changes the club president must make.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/proposals/${proposal.event_id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision, remarks }),
      });

      const data = await res.json();
      if (data.success) {
        onReviewSubmitted(data);
        onClose();
      } else {
        setError(data.message || 'Failed to submit review decision');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Faculty Mentor Governance Review
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-sm">
              Event: <span className="font-semibold text-slate-700">{proposal.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Decision Options */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Official Decision
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Approve */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  decision === 'approve'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === 'approve'}
                  onChange={() => setDecision('approve')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Approve Event Proposal
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Endorse proposal as verified. Forward to university admin for official publication to campus feed.
                  </p>
                </div>
              </label>

              {/* Option 2: Request Changes */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  decision === 'request_changes'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="request_changes"
                  checked={decision === 'request_changes'}
                  onChange={() => setDecision('request_changes')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Request Changes / Revisions
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Return proposal to club president with specific modification requirements before final approval.
                  </p>
                </div>
              </label>

              {/* Option 3: Reject */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  decision === 'reject'
                    ? 'border-rose-600 bg-rose-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={() => setDecision('reject')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Reject Proposal
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Decline event proposal due to schedule conflict, budget infeasibility, or policy violations.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Remarks Textarea */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Reviewer Remarks & Actionable Notes{' '}
              {decision === 'request_changes' ? (
                <span className="text-amber-600 font-bold">* Required</span>
              ) : (
                <span className="text-slate-400 font-normal">(Optional)</span>
              )}
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                decision === 'request_changes'
                  ? 'Specify required changes (e.g. Provide updated budget quotes for sound equipment, and coordinate venue safety with Campus Security).'
                  : 'Add any congratulatory notes or conditions for approval...'
              }
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none text-slate-800"
              required={decision === 'request_changes'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                decision === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decision === 'request_changes'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording Decision...
                </>
              ) : decision === 'approve' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Approval
                </>
              ) : decision === 'request_changes' ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Send Revision Request
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Confirm Rejection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
