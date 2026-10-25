import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Award,
  Edit3,
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
import { CertificateModal } from '../components/CertificateModal';
import { TemplateEditorModal } from '../components/TemplateEditorModal';

export function AdminDashboard() {
  const { token, user } = useAuth();
  const { subscribe } = useRealtime();

  const [analytics, setAnalytics] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [publishingId, setPublishingId] = useState(null);
  const [certModalEvent, setCertModalEvent] = useState(null);
  const [templateModalEvent, setTemplateModalEvent] = useState(null);

  // Fetch Admin Analytics & Proposals
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [analyticsRes, proposalsRes] = await Promise.all([
        fetch('/api/analytics/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/proposals', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const analyticsData = await analyticsRes.json();
      const proposalsData = await proposalsRes.json();

      if (analyticsData.success) setAnalytics(analyticsData);
      if (proposalsData.success) setProposals(proposalsData.proposals);
    } catch (err) {
      console.error('Admin Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time synchronization
  useEffect(() => {
    const unsubMetrics = subscribe('METRICS_UPDATED', () => {
      console.log('⚡ Real-time Admin Metrics Refreshed');
      fetchData();
    });

    const unsubProposal = subscribe('PROPOSAL_SUBMITTED', () => fetchData());
    const unsubStatus = subscribe('PROPOSAL_STATUS_CHANGED', () => fetchData());
    const unsubPub = subscribe('EVENT_PUBLISHED', () => fetchData());
    const unsubCert = subscribe('CERTIFICATE_AWARDED', () => fetchData());

    return () => {
      unsubMetrics();
      unsubProposal();
      unsubStatus();
      unsubPub();
      unsubCert();
    };
  }, [subscribe, fetchData]);

  // Handle direct publish
  const handlePublish = async (eventId, title) => {
    if (!window.confirm(`Publish "${title}" live to the student portal?`)) return;
    setPublishingId(eventId);
    try {
      const res = await fetch(`/api/proposals/${eventId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_highlighted: false }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Publishing failed');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setPublishingId(null);
    }
  };

  // Filtered proposals list
  const filteredProposals = proposals.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.venue.toLowerCase().includes(search.toLowerCase()) ||
      (p.club?.club_name && p.club.club_name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Aggregating live university event analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const viz = analytics?.visualizations || {};

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-800 text-white uppercase tracking-wider">
                Dean of Student Affairs
              </span>
              <span className="text-xs text-slate-400 font-mono">Live Data Sync Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              University Event Governance & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Comprehensive institutional oversight, proposal approval queues, and student participation metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Metrics
            </button>
          </div>
        </div>

        {/* 8 Actionable KPI Cards with Click-to-Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Proposals */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border text-left transition shadow-sm ${
              statusFilter === 'all'
                ? 'bg-brand-50 border-brand-800 ring-2 ring-brand-800'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proposals</span>
              <FileText className="w-4 h-4 text-brand-800" />
            </div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalProposals || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">All events in system</p>
          </button>

          {/* Card 2: Pending Review */}
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`p-4 rounded-xl border text-left transition shadow-sm ${
              statusFilter === 'pending_approval'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700">{metrics.pendingProposals || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting mentor decision</p>
          </button>

          {/* Card 3: Approved (Ready to Publish) */}
          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-xl border text-left transition shadow-sm ${
              statusFilter === 'approved'
                ? 'bg-green-50 border-green-600 ring-2 ring-green-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Approved</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-black text-green-700">{metrics.approvedProposals || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for public release</p>
          </button>

          {/* Card 4: Published Live */}
          <button
            onClick={() => setStatusFilter('published')}
            className={`p-4 rounded-xl border text-left transition shadow-sm ${
              statusFilter === 'published'
                ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Published Live</span>
              <Globe className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{metrics.publishedEvents || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Active on student portal</p>
          </button>

          {/* Card 5: Changes Requested */}
          <button
            onClick={() => setStatusFilter('changes_requested')}
            className={`p-4 rounded-xl border text-left transition shadow-sm ${
              statusFilter === 'changes_requested'
                ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Changes Requested</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700">{metrics.changesRequestedProposals || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Returned to presidents</p>
          </button>

          {/* Card 6: Drafts */}
          <button
            onClick={() => setStatusFilter('draft')}
            className={`p-4 rounded-xl border text-left transition shadow-sm ${
              statusFilter === 'draft'
                ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Drafts</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-black text-slate-700">{metrics.draftProposals || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Incomplete preparations</p>
          </button>

          {/* Card 7: Total Registrations */}
          <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Student Registrations</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700">{metrics.totalRegistrations || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Confirmed student seats</p>
          </div>

          {/* Card 8: Total Budget */}
          <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Allocated Budget</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">${metrics.totalBudget || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Campus event funding</p>
          </div>
        </div>

        {/* Meaningful Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Proposal Status Distribution (Donut Chart) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Proposal Lifecycle Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Proportion of event proposals across governance stages (Calculated from active database records)
              </p>
            </div>

            <div className="h-64 w-full">
              {viz.statusDistribution && viz.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viz.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      isAnimationActive={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {viz.statusDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} Proposals`, name]}
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No status distribution records available.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Club Activity & Student Participation (Horizontal Bar Chart) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Club Activity & Registrations
              </h3>
              <p className="text-xs text-slate-500">
                Comparison of event proposals submitted vs total verified student registrations per club
              </p>
            </div>

            <div className="h-64 w-full">
              {viz.clubActivity && viz.clubActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={viz.clubActivity}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="club_name"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="proposalsCount" name="Proposals Submitted" fill="#1E3A8A" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="registrationsCount" name="Student Registrations" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No club activity data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proposals Management & Governance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Proposals Governance Table
              </h3>
              <p className="text-xs text-slate-500">
                Showing {filteredProposals.length} of {proposals.length} recorded event proposals
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, venue, club..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium"
              >
                <option value="all">All Statuses ({proposals.length})</option>
                <option value="pending_approval">Pending Review ({metrics.pendingProposals || 0})</option>
                <option value="approved">Approved ({metrics.approvedProposals || 0})</option>
                <option value="published">Published ({metrics.publishedEvents || 0})</option>
                <option value="changes_requested">Changes Requested ({metrics.changesRequestedProposals || 0})</option>
                <option value="draft">Drafts ({metrics.draftProposals || 0})</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Event Proposal</th>
                  <th className="py-3 px-4">Organizing Club</th>
                  <th className="py-3 px-4">Date & Venue</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProposals.length > 0 ? (
                  filteredProposals.map((item) => (
                    <tr key={item.event_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                        <Link
                          to={`/proposals/${item.event_id}`}
                          className="hover:text-brand-800 transition block truncate"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Proposer: {item.creator?.name || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.event_type === 'official' ? (
                          <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-800 font-bold text-[10px]">
                            Official
                          </span>
                        ) : (
                          item.club?.club_name || 'Student Club'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <p>{new Date(item.event_date).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{item.venue}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 font-semibold">
                        ${item.budget || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'changes_requested'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          ● {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item._count?.registrations || 0} students
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Dedicated Event Dashboard Link */}
                          <Link
                            to={`/events/${item.event_id}/dashboard`}
                            className="px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded text-[11px] font-bold transition inline-flex items-center gap-1 shadow-sm"
                            title="Dedicated Event Analytics Dashboard & Roster"
                          >
                            <TrendingUp className="w-3 h-3 text-brand-800" />
                            Dashboard
                          </Link>

                          {/* Direct Publish Button if approved */}
                          {item.status === 'approved' && (
                            <button
                              onClick={() => handlePublish(item.event_id, item.title)}
                              disabled={publishingId === item.event_id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <Globe className="w-3 h-3" />
                              Publish
                            </button>
                          )}

                          {/* Dean's Virtual Certificate of Excellence Button */}
                          {(item.status === 'published' || item.status === 'approved') && (
                            <button
                              onClick={() => setCertModalEvent(item)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-bold transition inline-flex items-center gap-1 shadow-sm"
                              title="Award Dean's Virtual Certificate of Excellence"
                            >
                              <Award className="w-3 h-3 text-amber-600" />
                              {item.certificates && item.certificates.length > 0 ? 'Certified ⭐' : 'Award Cert'}
                            </button>
                          )}

                          {/* Standard Template In-App Editor Trigger */}
                          <button
                            onClick={() => setTemplateModalEvent(item)}
                            className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded transition"
                            title="Edit Standardized Institutional Proposal Template"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/proposals/${item.event_id}`}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Dossier
                          </Link>

                          <a
                            href={`/api/proposals/${item.event_id}/export-word?token=${token}`}
                            download
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-700 rounded transition"
                            title="Export Word Dossier"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          <a
                            href={`/api/proposals/${item.event_id}/export-pdf?token=${token}`}
                            download
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-rose-700 rounded transition"
                            title="Export PDF Dossier"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No event proposals match your selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dean's Virtual Certificate Award Studio Modal */}
      {certModalEvent && (
        <CertificateModal
          event={certModalEvent}
          isOpen={!!certModalEvent}
          onClose={() => setCertModalEvent(null)}
          onIssued={() => {
            setCertModalEvent(null);
            fetchData();
          }}
        />
      )}

      {/* Standard In-App Proposal Document Template Editor Modal */}
      {templateModalEvent && (
        <TemplateEditorModal
          event={templateModalEvent}
          isOpen={!!templateModalEvent}
          onClose={() => setTemplateModalEvent(null)}
          onSaved={() => {
            setTemplateModalEvent(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
