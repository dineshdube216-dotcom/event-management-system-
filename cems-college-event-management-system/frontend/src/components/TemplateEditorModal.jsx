import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Download,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function TemplateEditorModal({ event, eventId, eventTitle, isOpen, onClose, onSaved }) {
  const { token, user } = useAuth();
  const targetId = eventId || event?.event_id;
  const targetTitle = eventTitle || event?.title || 'Event Proposal';

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'budget' | 'schedule' | 'safety' | 'preview'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [template, setTemplate] = useState({
    executive_summary: {
      event_title: '',
      organizing_club: '',
      president_name: '',
      president_email: '',
      president_department: '',
      mentor_name: '',
      mentor_department: '',
      target_date: '',
      venue: '',
      expected_attendees: 100,
      total_budget_requested: 2500,
    },
    educational_objectives: '',
    target_audience: '',
    budget_breakdown: [],
    schedule_agenda: [],
    safety_and_crowd_protocol: '',
    facility_and_power_backup: '',
    declaration: '',
  });

  // Fetch current template from backend
  useEffect(() => {
    if (!isOpen || !targetId) return;

    const fetchTemplate = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/proposals/${targetId}/document-template`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.template) {
          setTemplate(data.template);
        }
      } catch (err) {
        setError('Failed to load document template: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [targetId, isOpen, token]);

  if (!isOpen) return null;

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/proposals/${targetId}/document-template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ template }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Official proposal template saved and updated successfully!');
        if (onSaved) onSaved(data.event);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save template');
      }
    } catch (err) {
      setError('Network error saving template: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add budget item
  const addBudgetItem = () => {
    setTemplate((prev) => ({
      ...prev,
      budget_breakdown: [
        ...(prev.budget_breakdown || []),
        { item: 'New Expense Item', amount: 200, notes: 'Justification' },
      ],
    }));
  };

  // Remove budget item
  const removeBudgetItem = (index) => {
    setTemplate((prev) => ({
      ...prev,
      budget_breakdown: prev.budget_breakdown.filter((_, i) => i !== index),
    }));
  };

  // Add schedule item
  const addScheduleItem = () => {
    setTemplate((prev) => ({
      ...prev,
      schedule_agenda: [
        ...(prev.schedule_agenda || []),
        { time: '10:00 AM - 11:00 AM', activity: 'Session Activity' },
      ],
    }));
  };

  // Remove schedule item
  const removeScheduleItem = (index) => {
    setTemplate((prev) => ({
      ...prev,
      schedule_agenda: prev.schedule_agenda.filter((_, i) => i !== index),
    }));
  };

  // Total calculated budget from line items
  const calculatedTotalBudget = (template.budget_breakdown || []).reduce(
    (sum, b) => sum + (parseFloat(b.amount) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400 text-slate-950">
                Official Institutional Template
              </span>
              <span className="text-xs text-slate-300">Live In-App Document Editor</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Event Proposal Dossier: {targetTitle}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/proposals/${targetId}/export-word?token=${token}`}
              download
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Word (.docx)
            </a>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 bg-slate-100 border-b border-slate-200 shrink-0 overflow-x-auto">
          {[
            { id: 'summary', label: '1. Executive Summary', icon: FileText },
            { id: 'budget', label: '2. Itemized Budget', icon: DollarSign },
            { id: 'schedule', label: '3. Hourly Agenda', icon: Calendar },
            { id: 'safety', label: '4. Safety & Facilities', icon: Shield },
            { id: 'preview', label: '5. Dossier Preview', icon: Eye },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-800 text-brand-800 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading standardized template parameters...
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={template.executive_summary?.event_title || ''}
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            executive_summary: {
                              ...template.executive_summary,
                              event_title: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Organizing Club & Department
                      </label>
                      <input
                        type="text"
                        value={template.executive_summary?.organizing_club || ''}
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            executive_summary: {
                              ...template.executive_summary,
                              organizing_club: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Club President / Lead Proposer
                      </label>
                      <input
                        type="text"
                        value={template.executive_summary?.president_name || ''}
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            executive_summary: {
                              ...template.executive_summary,
                              president_name: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Faculty Mentor
                      </label>
                      <input
                        type="text"
                        value={template.executive_summary?.mentor_name || ''}
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            executive_summary: {
                              ...template.executive_summary,
                              mentor_name: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Educational Objectives & Purpose
                    </label>
                    <textarea
                      rows={4}
                      value={template.educational_objectives || ''}
                      onChange={(e) =>
                        setTemplate({ ...template, educational_objectives: e.target.value })
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                      placeholder="Detail learning outcomes, speaker topics, and skills gained..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Target Audience & Eligibility
                    </label>
                    <input
                      type="text"
                      value={template.target_audience || ''}
                      onChange={(e) =>
                        setTemplate({ ...template, target_audience: e.target.value })
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                      placeholder="e.g. Open to all engineering students with valid student ADT credentials."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ITEMIZED BUDGET */}
              {activeTab === 'budget' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Total Itemized Budget: ${calculatedTotalBudget.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Proposal Total Requested: ${template.executive_summary?.total_budget_requested || 0}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addBudgetItem}
                      className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Expense Item
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(template.budget_breakdown || []).map((b, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Expense Item
                          </label>
                          <input
                            type="text"
                            value={b.item}
                            onChange={(e) => {
                              const updated = [...template.budget_breakdown];
                              updated[idx].item = e.target.value;
                              setTemplate({ ...template, budget_breakdown: updated });
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-800"
                          />
                        </div>

                        <div className="w-full sm:w-36">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Amount ($)
                          </label>
                          <input
                            type="number"
                            value={b.amount}
                            onChange={(e) => {
                              const updated = [...template.budget_breakdown];
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                              setTemplate({ ...template, budget_breakdown: updated });
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-800"
                          />
                        </div>

                        <div className="flex-1 w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Justification / Vendor Notes
                          </label>
                          <input
                            type="text"
                            value={b.notes || ''}
                            onChange={(e) => {
                              const updated = [...template.budget_breakdown];
                              updated[idx].notes = e.target.value;
                              setTemplate({ ...template, budget_breakdown: updated });
                            }}
                            placeholder="Vendor quote or note"
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-800"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBudgetItem(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition self-end sm:self-center"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: HOURLY AGENDA */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Event Run-of-Show & Program Milestones
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Detail timing slots for student registration, keynotes, competition, and valedictory
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addScheduleItem}
                      className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Time Slot
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(template.schedule_agenda || []).map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3"
                      >
                        <div className="w-full sm:w-48">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Time Window
                          </label>
                          <input
                            type="text"
                            value={s.time}
                            onChange={(e) => {
                              const updated = [...template.schedule_agenda];
                              updated[idx].time = e.target.value;
                              setTemplate({ ...template, schedule_agenda: updated });
                            }}
                            placeholder="e.g. 10:00 AM - 11:30 AM"
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-800"
                          />
                        </div>

                        <div className="flex-1 w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Scheduled Activity
                          </label>
                          <input
                            type="text"
                            value={s.activity}
                            onChange={(e) => {
                              const updated = [...template.schedule_agenda];
                              updated[idx].activity = e.target.value;
                              setTemplate({ ...template, schedule_agenda: updated });
                            }}
                            placeholder="Activity description"
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-800"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeScheduleItem(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition self-end sm:self-center"
                          title="Remove time slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SAFETY & FACILITIES */}
              {activeTab === 'safety' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Safety, First Aid & Crowd Management Protocol
                    </label>
                    <textarea
                      rows={3}
                      value={template.safety_and_crowd_protocol || ''}
                      onChange={(e) =>
                        setTemplate({ ...template, safety_and_crowd_protocol: e.target.value })
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Power Backup & Facility Logistics
                    </label>
                    <textarea
                      rows={3}
                      value={template.facility_and_power_backup || ''}
                      onChange={(e) =>
                        setTemplate({ ...template, facility_and_power_backup: e.target.value })
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Official Organizing Committee Declaration
                    </label>
                    <textarea
                      rows={3}
                      value={template.declaration || ''}
                      onChange={(e) =>
                        setTemplate({ ...template, declaration: e.target.value })
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: FORMATTED PREVIEW */}
              {activeTab === 'preview' && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
                  <div className="text-center border-b pb-4 border-slate-200">
                    <p className="font-extrabold text-sm text-brand-900">COLLEGE EVENT MANAGEMENT SYSTEM (CEMS)</p>
                    <p className="text-[11px] text-slate-500">Official Standardized Event Proposal Dossier</p>
                    <h2 className="text-lg font-black text-slate-900 mt-2">{template.executive_summary?.event_title}</h2>
                    <p className="text-slate-600">
                      Organized by: <strong>{template.executive_summary?.organizing_club}</strong> | Lead: {template.executive_summary?.president_name}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800">1. Educational Purpose & Scope:</p>
                    <p className="text-slate-600 mt-0.5">{template.educational_objectives}</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800">2. Budget Breakdown (${calculatedTotalBudget.toLocaleString()}):</p>
                    <div className="mt-1 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                      {(template.budget_breakdown || []).map((b, i) => (
                        <div key={i} className="p-2 flex justify-between">
                          <span>{b.item}</span>
                          <span className="font-bold">${b.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800">3. Scheduled Agenda:</p>
                    <div className="mt-1 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                      {(template.schedule_agenda || []).map((s, i) => (
                        <div key={i} className="p-2 flex justify-between">
                          <span className="font-semibold text-slate-500">{s.time}</span>
                          <span className="text-slate-800 font-medium">{s.activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Changes auto-synchronize to Word (.docx) and PDF downloads.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Document Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
