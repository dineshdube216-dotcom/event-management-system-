import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Award,
  Globe,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export function ProposalTimeline({ status, timeline = [], currentRole }) {
  // Ordered standard stages
  const standardStages = [
    { key: 'draft_created', label: 'Proposal Created', icon: FileText },
    { key: 'documents_uploaded', label: 'Documents Prepared', icon: FileText },
    { key: 'submitted', label: 'Proposal Submitted', icon: Send },
    { key: 'mentor_review', label: 'Mentor Review', icon: Clock },
    { key: 'approved', label: 'Approval Completed', icon: Award },
    { key: 'published', label: 'Event Published', icon: Globe },
  ];

  // Map recorded timeline events by stage
  const timelineMap = {};
  timeline.forEach((item) => {
    timelineMap[item.stage] = item;
  });

  const isChangesRequested = status === 'changes_requested';
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved' || status === 'published';
  const isPublished = status === 'published';
  const isSubmitted = status !== 'draft';

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Visual Proposal Approval Workflow & Audit Trail
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-stage governance tracking from proposal inception to campus broadcast
          </p>
        </div>
        <div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isPublished
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : isApproved
                ? 'bg-green-100 text-green-800 border border-green-300'
                : isChangesRequested
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : isRejected
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}
          >
            ● {status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Progress Stepper Line */}
      <div className="relative mb-8 px-2">
        <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
        
        {/* Dynamic completed progress fill */}
        <div
          className="hidden sm:block absolute top-1/2 left-0 h-1 bg-brand-800 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: isPublished
              ? '100%'
              : isApproved
              ? '80%'
              : isChangesRequested
              ? '60%'
              : isSubmitted
              ? '45%'
              : '15%',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
          {/* Step 1: Created */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 flex-1">
            <div className="w-9 h-9 rounded-full bg-brand-800 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">1. Draft Created</p>
              <p className="text-[11px] text-slate-400">
                {timelineMap['draft_created'] ? formatDate(timelineMap['draft_created'].created_at) : 'Completed'}
              </p>
            </div>
          </div>

          {/* Step 2: Documents */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${
                timelineMap['documents_uploaded'] || isSubmitted
                  ? 'bg-brand-800 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">2. Documents</p>
              <p className="text-[11px] text-slate-400">
                {timelineMap['documents_uploaded']
                  ? formatDate(timelineMap['documents_uploaded'].created_at)
                  : isSubmitted
                  ? 'Attached'
                  : 'Pending'}
              </p>
            </div>
          </div>

          {/* Step 3: Submitted */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${
                isSubmitted ? 'bg-brand-800 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">3. Submitted</p>
              <p className="text-[11px] text-slate-400">
                {timelineMap['submitted'] ? formatDate(timelineMap['submitted'].created_at) : isSubmitted ? 'Forwarded' : 'Waiting'}
              </p>
            </div>
          </div>

          {/* Step 4: Mentor Review / Changes */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${
                isChangesRequested
                  ? 'bg-amber-500 text-white animate-pulse'
                  : isApproved
                  ? 'bg-brand-800 text-white'
                  : isSubmitted
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isChangesRequested ? (
                <AlertTriangle className="w-4 h-4" />
              ) : isApproved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <p
                className={`text-xs font-bold ${
                  isChangesRequested ? 'text-amber-700' : 'text-slate-800'
                }`}
              >
                {isChangesRequested ? '4. Revisions Needed' : '4. Mentor Review'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isChangesRequested
                  ? 'Changes Requested'
                  : isApproved
                  ? 'Verified'
                  : isSubmitted
                  ? 'In Progress'
                  : 'Awaiting'}
              </p>
            </div>
          </div>

          {/* Step 5: Approved */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${
                isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">5. Approved</p>
              <p className="text-[11px] text-slate-400">
                {timelineMap['approved'] ? formatDate(timelineMap['approved'].created_at) : isApproved ? 'Approved' : 'Pending'}
              </p>
            </div>
          </div>

          {/* Step 6: Published */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${
                isPublished ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">6. Published</p>
              <p className="text-[11px] text-slate-400">
                {timelineMap['published'] ? formatDate(timelineMap['published'].created_at) : 'Not Published'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Guidance Banner */}
      <div
        className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${
          isChangesRequested
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : isPublished
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isApproved
            ? 'bg-green-50 border-green-200 text-green-900'
            : status === 'pending_approval'
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="mt-0.5">
          {isChangesRequested ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : isPublished ? (
            <Globe className="w-5 h-5 text-emerald-600" />
          ) : isApproved ? (
            <Award className="w-5 h-5 text-green-600" />
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="text-sm">
          <p className="font-semibold">
            {isChangesRequested
              ? 'Action Required: Revisions Requested by Faculty Mentor'
              : isPublished
              ? 'Live Event: Published & Accepting Student Registrations'
              : isApproved
              ? 'Ready to Publish: Waiting for Dean/Admin Final Release'
              : status === 'pending_approval'
              ? 'Pending Review: Faculty Mentor Review in Progress'
              : 'Draft Proposal: Prepare Details and Documents to Submit'}
          </p>
          <p className="text-xs opacity-90 mt-0.5">
            {isChangesRequested
              ? 'The assigned mentor has requested modifications. Review the remarks below, update your proposal/documents, and resubmit for review.'
              : isPublished
              ? 'The event is active on the campus-wide student portal. Registrations are automatically synced in real time.'
              : isApproved
              ? 'The proposal has met all mentor criteria. University Administration can now publish it to the student portal.'
              : status === 'pending_approval'
              ? 'Your proposal is in the mentor review queue. You will receive a real-time notification once a decision is made.'
              : 'Add necessary venue permits, estimated budgets, and schedules before forwarding to your mentor.'}
          </p>
        </div>
      </div>

      {/* Detailed Chronological Audit Log */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Chronological Audit History
        </h4>
        <div className="space-y-3">
          {timeline && timeline.length > 0 ? (
            timeline.map((event, idx) => (
              <div
                key={event.timeline_id || idx}
                className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg transition-colors border border-slate-150"
              >
                <div className="mt-0.5">
                  {event.stage === 'published' ? (
                    <Globe className="w-4 h-4 text-emerald-600" />
                  ) : event.stage === 'approved' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : event.stage === 'changes_requested' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : event.stage === 'rejected' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {event.title || event.stage}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {event.description || `Action taken by ${event.actor_name || 'System'} (${event.actor_role || 'Automated'})`}
                  </p>
                  {event.remarks && (
                    <div className="mt-2 p-2 bg-amber-50/80 border-l-2 border-amber-500 rounded text-xs text-amber-950 font-medium">
                      <span className="font-bold">Reviewer Remarks:</span> "{event.remarks}"
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No timeline entries recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
