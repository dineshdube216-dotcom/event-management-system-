import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Users,
  Calendar,
  MapPin,
  Edit3,
  Send,
  Eye,
  RefreshCw,
  Award,
  BarChart2,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { ProposalModal } from '../components/ProposalModal';
import { TemplateEditorModal } from '../components/TemplateEditorModal';
import { CertificateModal } from '../components/CertificateModal';

export function PresidentDashboard() {
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();

  const [analytics, setAnalytics] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);

  // Fetch Club President Data & Certificates
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [analyticsRes, proposalsRes, certsRes] = await Promise.all([
        fetch('/api/analytics/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/proposals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/certificates', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const analyticsData = await analyticsRes.json();
      const proposalsData = await proposalsRes.json();
      const certsData = await certsRes.json();

      if (analyticsData.success) setAnalytics(analyticsData);
      if (proposalsData.success) setProposals(proposalsData.proposals);
      if (certsData.success) setCertificates(certsData.certificates || []);
    } catch (err) {
      console.error('President Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time synchronization
  useEffect(() => {
    const unsubStatus = subscribe('PROPOSAL_STATUS_CHANGED', (data) => {
      fetchData();
    });

    const unsubDoc = subscribe('DOCUMENT_UPDATED', () => fetchData());
    const unsubMetrics = subscribe('METRICS_UPDATED', () => fetchData());
    const unsubPub = subscribe('EVENT_PUBLISHED', () => fetchData());
    const unsubCert = subscribe('CERTIFICATE_AWARDED', () => fetchData());

    return () => {
      unsubStatus();
      unsubDoc();
      unsubMetrics();
      unsubPub();
      unsubCert();
    };
  }, [subscribe, fetchData]);

  // Submit draft for review directly
  const handleSubmitForReview = async (eventId, title) => {
    if (!window.confirm(`Submit proposal "${title}" to your faculty mentor for review?`)) return;
    try {
      const res = await fetch(`/api/proposals/${eventId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Submission failed');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading club event management workspace...</p>
        </div>
      </div>
    );
  }

  const club = analytics?.club;
  const metrics = analytics?.metrics || {};
  const viz = analytics?.visualizations || {};
  const actionRequiredProposals = proposals.filter((p) => p.status === 'changes_requested');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* President Club Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-800 text-white uppercase tracking-wider">
                Club President Workspace
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Club: <strong className="text-slate-800">{club?.club_name || 'Hack&Code Developers Club'}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Event Proposal & Leadership Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Assigned Faculty Mentor:{' '}
              <strong className="text-slate-700">
                {club?.mentor?.name || 'Prof. Alan Turing'} ({club?.mentor?.email || 'mentor@college.edu'})
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingProposal(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              Propose New Event
            </button>
          </div>
        </div>

        {/* Action Alert if Changes Requested on Any Proposal */}
        {actionRequiredProposals.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">
                  Action Required: Mentor Requested Changes on {actionRequiredProposals.length} Proposal(s)
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Review faculty remarks, edit the standardized template or budget details in-app, and resubmit for approval.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {actionRequiredProposals.map((item) => (
                <button
                  key={item.event_id}
                  onClick={() => {
                    setEditingProposal(item);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Revise: {item.title.substring(0, 16)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proposals</span>
              <FileText className="w-4 h-4 text-brand-800" />
            </div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalProposals || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Club event initiatives</p>
          </div>

          <div className="p-4 rounded-2xl border bg-white border-blue-200 shadow-sm ring-1 ring-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Under Mentor Review</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700">{metrics.pendingCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Waiting for decision</p>
          </div>

          <div className="p-4 rounded-2xl border bg-white border-amber-200 shadow-sm ring-1 ring-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Changes Requested</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700">{metrics.changesRequestedCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Needs your revision</p>
          </div>

          <div className="p-4 rounded-2xl border bg-white border-emerald-200 shadow-sm ring-1 ring-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Published Live</span>
              <Globe className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{metrics.publishedCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">On campus portal</p>
          </div>

          <div className="p-4 rounded-2xl border bg-white border-purple-200 shadow-sm ring-1 ring-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Student Registrations</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700">{metrics.totalRegistrations || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total participants</p>
          </div>
        </div>

        {/* Dean's Virtual Honors & Certificates Section */}
        {certificates.length > 0 && (
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    Dean's Honors & Virtual Certificates of Excellence ({certificates.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official presidential honors conferred by Dean Dr. Sarah Jenkins for exemplary event execution
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.certificate_id}
                  className="p-5 bg-white rounded-2xl border border-amber-200 shadow-sm hover:border-amber-400 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                        ⭐ Certified Honor
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {cert.certificate_number}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{cert.event_title}</h4>
                    <p className="text-xs text-slate-600 italic mt-1.5 line-clamp-2">
                      "{cert.citation}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Conferred by <strong>{cert.issued_by_name}</strong> on{' '}
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Certificate
                    </button>

                    <a
                      href={`/api/certificates/${cert.certificate_id}/export-pdf`}
                      download
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Charts (Optimized with isAnimationActive={false} to eliminate render lag) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Proposal Status Proportions
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time progression of club proposals across review stages
            </p>

            <div className="h-60 w-full">
              {viz.statusDistribution && viz.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viz.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      isAnimationActive={false}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {viz.statusDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No proposal records yet.
                </div>
              )}
            </div>
          </div>

          {/* Student Registrations by Event */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Student Attendance & Capacity Utilization
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Verified registrations vs capacity target for published events
            </p>

            <div className="h-60 w-full">
              {viz.eventAttendanceData && viz.eventAttendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viz.eventAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="registrations" name="Registered Students" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="capacity" name="Target Capacity" fill="#94A3B8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Publish events to track student attendance.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Club Event Proposals Portfolio */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Club Event Proposals & Governance Portfolio
              </h3>
              <p className="text-xs text-slate-500">
                Track status timelines, documents, reviewer feedback, and resubmissions
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {proposals.map((item) => (
              <div
                key={item.event_id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{item.title}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'changes_requested'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : item.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      ● {item.status.replace('_', ' ')}
                    </span>

                    {item.certificates && item.certificates.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" /> Dean Certificate
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Date: {new Date(item.event_date).toLocaleDateString()} • Venue: {item.venue} • Budget: ${item.budget || 0} • {item._count?.registrations || 0} Students Registered
                  </p>

                  {item.status === 'changes_requested' && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                      <strong>Mentor Feedback:</strong> "{item.approvals?.[0]?.remarks || 'Modifications requested'}"
                    </div>
                  )}
                </div>

                {/* 3 Explicit Action Buttons for Every Event */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  {/* Dedicated Event Dashboard Button */}
                  <Link
                    to={`/events/${item.event_id}/dashboard`}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
                    title="Open dedicated event analytics dashboard and student roster"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-brand-800" />
                    Event Dashboard
                  </Link>

                  {/* In-App Document Template Editor Button */}
                  <button
                    onClick={() => setSelectedTemplateEvent(item)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
                    title="Edit standardized proposal document template in-app"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    Edit Template
                  </button>

                  {/* Draft Submit Button */}
                  {item.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitForReview(item.event_id, item.title)}
                      className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  )}

                  {/* Changes Requested Revise Button */}
                  {item.status === 'changes_requested' && (
                    <button
                      onClick={() => {
                        setEditingProposal(item);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Revise
                    </button>
                  )}

                  <Link
                    to={`/proposals/${item.event_id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Timeline & Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proposal Creation / Edit Modal */}
      {isModalOpen && (
        <ProposalModal
          proposal={editingProposal}
          club={club}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProposal(null);
          }}
          onProposalSaved={() => {
            fetchData();
          }}
        />
      )}

      {/* Common Template Document In-App Editor */}
      {selectedTemplateEvent && (
        <TemplateEditorModal
          eventId={selectedTemplateEvent.event_id}
          eventTitle={selectedTemplateEvent.title}
          isOpen={Boolean(selectedTemplateEvent)}
          onClose={() => setSelectedTemplateEvent(null)}
          onSaved={() => {
            fetchData();
          }}
        />
      )}

      {/* Dean's Virtual Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          existingCertificate={selectedCert}
          isOpen={Boolean(selectedCert)}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
