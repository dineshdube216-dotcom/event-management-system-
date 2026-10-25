import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Globe,
  Edit3,
  RefreshCw,
  Building,
  Award,
  Download,
  FileText,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { ProposalTimeline } from '../components/ProposalTimeline';
import { DocumentManager } from '../components/DocumentManager';
import { ReviewModal } from '../components/ReviewModal';
import { ProposalModal } from '../components/ProposalModal';
import { TemplateEditorModal } from '../components/TemplateEditorModal';
import { CertificateModal } from '../components/CertificateModal';

export function ProposalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Fetch proposal data
  const fetchProposal = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProposal(data.proposal);
      } else {
        setError(data.message || 'Proposal not found');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  // Real-time synchronization subscriptions
  useEffect(() => {
    const unsubStatus = subscribe('PROPOSAL_STATUS_CHANGED', (data) => {
      if (data.event_id === id) {
        console.log('⚡ Real-time Proposal Status Update received:', data);
        fetchProposal();
      }
    });

    const unsubDoc = subscribe('DOCUMENT_UPDATED', (data) => {
      if (data.event_id === id) {
        console.log('⚡ Real-time Document Update received:', data);
        fetchProposal();
      }
    });

    const unsubPub = subscribe('EVENT_PUBLISHED', (data) => {
      if (data.event_id === id) {
        fetchProposal();
      }
    });

    const unsubCert = subscribe('CERTIFICATE_AWARDED', (data) => {
      if (data.event_id === id) {
        fetchProposal();
      }
    });

    return () => {
      unsubStatus();
      unsubDoc();
      unsubPub();
      unsubCert();
    };
  }, [id, subscribe, fetchProposal]);

  // Admin publish action
  const handlePublishEvent = async () => {
    if (!window.confirm(`Are you sure you want to publish "${proposal.title}" live to the student portal?`)) {
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/proposals/${id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_highlighted: false }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProposal();
      } else {
        alert(data.message || 'Publishing failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading proposal dossier & timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Cannot View Proposal</h3>
          <p className="text-xs text-slate-500 mb-4">{error || 'Proposal could not be loaded.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const dashboardRoute =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'mentor'
      ? '/mentor/dashboard'
      : user?.role === 'president'
      ? '/president/dashboard'
      : '/';

  const isMentor = user?.role === 'mentor' && (proposal.club?.mentor_id === user.user_id || user.role === 'admin');
  const isAdmin = user?.role === 'admin';
  const isPresident = user?.role === 'president' && (proposal.club?.president_id === user.user_id || proposal.created_by === user.user_id);
  const canReview = (isMentor || isAdmin) && proposal.status === 'pending_approval';
  const canPublish = isAdmin && (proposal.status === 'approved' || proposal.status === 'published');
  const canEdit = isPresident && (proposal.status === 'draft' || proposal.status === 'changes_requested');
  const canUploadDocs = isPresident || isMentor || isAdmin;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Action Bar with Explicit Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link
              to={dashboardRoute}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Proposal Dossier</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-xs">{proposal.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dedicated Event Dashboard Link */}
            <Link
              to={`/events/${proposal.event_id}/dashboard`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
              title="Dedicated Event Analytics Dashboard & Attendance Roster"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Event Dashboard
            </Link>

            {/* In-App Standardized Proposal Template Editor */}
            <button
              onClick={() => setIsTemplateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl transition shadow-sm"
              title="View & Edit Standardized Institutional Proposal Template"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              Edit Template
            </button>

            {/* Word & PDF Export Buttons */}
            <a
              href={`/api/proposals/${proposal.event_id}/export-word?token=${token}`}
              download
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-sm transition"
              title="Download Word (.docx) Dossier"
            >
              <FileText className="w-4 h-4 text-blue-700" />
            </a>

            <a
              href={`/api/proposals/${proposal.event_id}/export-pdf?token=${token}`}
              download
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shadow-sm transition"
              title="Download Formal PDF Dossier"
            >
              <Download className="w-4 h-4 text-rose-700" />
            </a>

            {/* Dean's Virtual Certificate of Excellence Trigger */}
            {isAdmin && (proposal.status === 'published' || proposal.status === 'approved') && (
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition shadow-sm"
                title="Confer Dean's Virtual Certificate of Excellence"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Award Dean Cert
              </button>
            )}

            <button
              onClick={fetchProposal}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 shadow-sm transition"
              title="Sync Latest Proposal State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {proposal.banner_image_url && (
            <div className="h-48 sm:h-64 w-full relative overflow-hidden bg-slate-900">
              <img
                src={proposal.banner_image_url}
                alt={proposal.title}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-800 text-white shadow">
                    {proposal.event_type === 'official' ? 'Official University Event' : proposal.club?.club_name || 'Club Event'}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">
                    {proposal.title}
                  </h1>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow ${
                    proposal.status === 'published'
                      ? 'bg-emerald-600 text-white'
                      : proposal.status === 'approved'
                      ? 'bg-green-600 text-white'
                      : proposal.status === 'changes_requested'
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  ● {proposal.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Metadata Bar */}
          <div className="p-6 bg-white border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
                <p className="text-xs font-semibold text-slate-800">
                  {new Date(proposal.event_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venue</p>
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]" title={proposal.venue}>
                  {proposal.venue}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget</p>
                <p className="text-xs font-semibold text-slate-800">${proposal.budget || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendees</p>
                <p className="text-xs font-semibold text-slate-800">{proposal.expected_attendees || 0} Capacity</p>
              </div>
            </div>
          </div>

          {/* Description & Action Bar */}
          <div className="p-6">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Proposal Brief & Purpose
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
              {proposal.description}
            </p>

            {/* Governance Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
              {/* Mentor Review Trigger */}
              {canReview && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Review Proposal (Approve / Request Changes)
                </button>
              )}

              {/* Admin Publish Trigger */}
              {canPublish && proposal.status !== 'published' && (
                <button
                  onClick={handlePublishEvent}
                  disabled={isPublishing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" />
                  {isPublishing ? 'Publishing...' : 'Publish Live to Campus Feed'}
                </button>
              )}

              {/* President Edit Trigger */}
              {canEdit && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Edit3 className="w-4 h-4" />
                  {proposal.status === 'changes_requested'
                    ? 'Revise Proposal & Address Feedback'
                    : 'Edit Proposal Draft'}
                </button>
              )}

              <div className="ml-auto text-xs text-slate-400">
                Created by <span className="font-semibold text-slate-700">{proposal.creator?.name}</span> ({proposal.creator?.role})
              </div>
            </div>
          </div>
        </div>

        {/* Visual Proposal Approval Workflow & Timeline */}
        <ProposalTimeline
          status={proposal.status}
          timeline={proposal.timeline || []}
          currentRole={user?.role}
        />

        {/* Document Management & Version Tracker */}
        <DocumentManager
          eventId={proposal.event_id}
          documents={proposal.documents || []}
          onDocumentUploaded={fetchProposal}
          canUpload={canUploadDocs}
          canReview={isMentor || isAdmin}
        />
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <ReviewModal
          proposal={proposal}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewSubmitted={() => {
            fetchProposal();
          }}
        />
      )}

      {/* Edit Proposal Modal */}
      {isEditModalOpen && (
        <ProposalModal
          proposal={proposal}
          club={proposal.club}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProposalSaved={() => {
            fetchProposal();
          }}
        />
      )}

      {/* In-App Standard Proposal Document Template Editor Modal */}
      {isTemplateOpen && proposal && (
        <TemplateEditorModal
          event={proposal}
          isOpen={isTemplateOpen}
          onClose={() => setIsTemplateOpen(false)}
          onSaved={() => {
            setIsTemplateOpen(false);
            fetchProposal();
          }}
        />
      )}

      {/* Dean's Virtual Certificate Award Studio Modal */}
      {isCertModalOpen && proposal && (
        <CertificateModal
          event={proposal}
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          onIssued={() => {
            setIsCertModalOpen(false);
            fetchProposal();
          }}
        />
      )}
    </div>
  );
}
