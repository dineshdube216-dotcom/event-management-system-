import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  Eye,
  Check,
  RefreshCw,
  Award,
  TrendingUp,
  BarChart2,
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
import { ReviewModal } from '../components/ReviewModal';
import { TemplateEditorModal } from '../components/TemplateEditorModal';

export function MentorDashboard() {
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();

  const [analytics, setAnalytics] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState(null);

  // Fetch Mentor Dashboard Data
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
      console.error('Mentor Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time synchronization: when a club president submits a proposal, mentor sees it live!
  useEffect(() => {
    const unsubSub = subscribe('PROPOSAL_SUBMITTED', (data) => {
      console.log('⚡ Real-time Proposal Submitted notification received for Mentor:', data);
      fetchData();
    });

    const unsubStatus = subscribe('PROPOSAL_STATUS_CHANGED', () => {
      fetchData();
    });

    const unsubMetrics = subscribe('METRICS_UPDATED', () => {
      fetchData();
    });

    return () => {
      unsubSub();
      unsubStatus();
      unsubMetrics();
    };
  }, [subscribe, fetchData]);

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading faculty mentorship records...</p>
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const pendingQueue = analytics?.pendingQueue || [];
  const viz = analytics?.visualizations || {};

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Mentor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-800 text-white uppercase tracking-wider">
                Faculty Mentor Review Console
              </span>
              <span className="text-xs text-slate-400 font-mono">Live Subscriptions Connected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review event proposals, inspect budgets, verify venue safety permits, and provide actionable feedback
            </p>
          </div>

          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border bg-white border-blue-200 shadow-sm ring-1 ring-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700">{metrics.pendingCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Requires your decision</p>
          </div>

          <div className="p-4 rounded-xl border bg-white border-green-200 shadow-sm ring-1 ring-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Approved Proposals</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-black text-green-700">{metrics.approvedCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Endorsed for conduct</p>
          </div>

          <div className="p-4 rounded-xl border bg-white border-amber-200 shadow-sm ring-1 ring-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Changes Requested</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700">{metrics.changesRequestedCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting club revisions</p>
          </div>

          <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Mentored Events</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalUnderMentorship || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Across assigned student clubs</p>
          </div>
        </div>

        {/* Action-Required: High Priority Pending Reviews Queue */}
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm ring-1 ring-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                Action Required: Pending Event Review Queue ({pendingQueue.length})
              </h3>
              <p className="text-xs text-slate-500">
                Newly submitted club event proposals requiring faculty verification and approval
              </p>
            </div>
          </div>

          {pendingQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingQueue.map((item) => (
                <div
                  key={item.event_id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {item.club?.club_name || 'Club Proposal'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                        {item.title}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.event_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 truncate" title={item.venue}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.venue}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      By {item.creator?.name} • {item._count?.documents || 0} Docs
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        to={`/events/${item.event_id}/dashboard`}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                        title="Dedicated Event Analytics Dashboard"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Dashboard
                      </Link>

                      <button
                        onClick={() => setSelectedTemplateEvent(item)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                        title="Inspect/Edit In-App Standardized Proposal Template"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        Template
                      </button>

                      <Link
                        to={`/proposals/${item.event_id}`}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
                      >
                        Dossier
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedProposal(item);
                          setIsReviewOpen(true);
                        }}
                        className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Review & Decide
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All caught up! No pending proposals are currently waiting for your review.
            </div>
          )}
        </div>

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Mentored Proposal Decisions Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribution of review outcomes for assigned clubs
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
                  No decision records available.
                </div>
              )}
            </div>
          </div>

          {/* Club Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Submissions by Mentored Club
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total vs Approved event proposals per club
            </p>

            <div className="h-60 w-full">
              {viz.clubBreakdown && viz.clubBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viz.clubBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="club_name" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="total" name="Total Proposals" fill="#1E3A8A" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No club breakdown data.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Mentored Proposals List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Complete Mentorship Event Portfolio
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            All current and archived event proposals under your faculty mentorship
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {proposals.map((item) => (
              <div
                key={item.event_id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {item.club?.club_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'changes_requested'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      ● {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Date: {new Date(item.event_date).toLocaleDateString()} • Venue: {item.venue} • Proposer: {item.creator?.name}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                  <Link
                    to={`/events/${item.event_id}/dashboard`}
                    className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition shadow-sm"
                    title="Dedicated Event Analytics Dashboard"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>

                  <button
                    onClick={() => setSelectedTemplateEvent(item)}
                    className="p-1.5 hover:bg-amber-50 text-slate-500 hover:text-amber-800 rounded-lg border border-slate-200 transition"
                    title="Inspect In-App Standardized Proposal Template"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to={`/proposals/${item.event_id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Dossier & Timeline
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* In-App Standard Proposal Document Template Editor Modal */}
      {selectedTemplateEvent && (
        <TemplateEditorModal
          event={selectedTemplateEvent}
          isOpen={!!selectedTemplateEvent}
          onClose={() => setSelectedTemplateEvent(null)}
          onSaved={() => {
            setSelectedTemplateEvent(null);
            fetchData();
          }}
        />
      )}

      {/* Review Modal */}
      {isReviewOpen && selectedProposal && (
        <ReviewModal
          proposal={selectedProposal}
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setSelectedProposal(null);
          }}
          onReviewSubmitted={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
