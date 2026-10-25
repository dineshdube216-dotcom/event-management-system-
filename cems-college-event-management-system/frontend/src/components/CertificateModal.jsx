import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Download,
  Printer,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function CertificateModal({
  event,
  existingCertificate,
  isOpen,
  onClose,
  onCertificateIssued,
  onIssued,
}) {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_role: 'Club President & Lead Organizer',
    event_title: '',
    club_name: '',
    citation: '',
    issued_by_name: 'Dr. Sarah Jenkins, Dean of Student Affairs',
    certificate_number: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [issuedCert, setIssuedCert] = useState(existingCertificate || null);

  useEffect(() => {
    if (existingCertificate) {
      setIssuedCert(existingCertificate);
      setFormData({
        recipient_name: existingCertificate.recipient_name,
        recipient_role: existingCertificate.recipient_role,
        event_title: existingCertificate.event_title,
        club_name: existingCertificate.club_name,
        citation: existingCertificate.citation,
        issued_by_name: existingCertificate.issued_by_name,
        certificate_number: existingCertificate.certificate_number,
      });
    } else if (event) {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        recipient_name: event.creator?.name || 'Alex Rivera',
        recipient_role: 'Club President & Lead Organizer',
        event_title: event.title,
        club_name: event.club?.club_name || 'Hack&Code Developers Club',
        citation: `In commendation of extraordinary campus leadership and exemplary orchestration of "${event.title}", fostering academic innovation and high student engagement.`,
        issued_by_name: `${user?.name || 'Dr. Sarah Jenkins'}, Dean of Student Affairs`,
        certificate_number: `CEMS-CERT-${year}-${randNum}`,
      });
    }
  }, [event, existingCertificate, user]);

  if (!isOpen) return null;

  const handleIssue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: event.event_id,
          recipient_id: event.created_by,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIssuedCert(data.certificate);
        const callback = onCertificateIssued || onIssued;
        if (callback) callback(data.certificate);
      } else {
        setError(data.message || 'Failed to issue certificate');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Dean's Virtual Certificate of Excellence
              </h3>
              <p className="text-xs text-slate-400">
                Official institutional recognition for outstanding club event leadership
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {issuedCert && (
              <>
                <a
                  href={`/api/certificates/${issuedCert.certificate_id}/export-pdf`}
                  download
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Editable Form for Dean */}
          {isAdmin && !issuedCert && (
            <div className="lg:col-span-5 space-y-3.5 pr-2 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Certificate Customization
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient President Name
                </label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Role Title & Club
                </label>
                <input
                  type="text"
                  value={formData.recipient_role}
                  onChange={(e) => setFormData({ ...formData, recipient_role: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Commendation Citation / Reason
                </label>
                <textarea
                  rows={3}
                  value={formData.citation}
                  onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Dean Signatory
                  </label>
                  <input
                    type="text"
                    value={formData.issued_by_name}
                    onChange={(e) => setFormData({ ...formData, issued_by_name: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.certificate_number}
                    onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-800 font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleIssue}
                disabled={isSubmitting}
                className="w-full mt-3 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Issuing Certificate...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Award & Issue Certificate
                  </>
                )}
              </button>
            </div>
          )}

          {/* Right Column: Live Certificate Canvas Preview */}
          <div className={isAdmin && !issuedCert ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <div className="p-1 bg-amber-500 rounded-2xl shadow-xl">
              <div className="p-6 sm:p-8 bg-amber-50/40 rounded-xl border-4 border-amber-600 relative overflow-hidden text-center font-serif text-slate-800">
                {/* Watermark ribbon */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-amber-100/80 border border-amber-300 rounded-full text-[10px] font-sans font-bold text-amber-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Certified Digital Award
                </div>

                {/* College Title */}
                <p className="text-xs sm:text-sm font-sans tracking-widest text-brand-900 font-extrabold uppercase">
                  College of Engineering & Technology
                </p>
                <p className="text-[11px] font-sans tracking-wider text-slate-500 uppercase mt-0.5">
                  Office of the Dean of Student Affairs
                </p>

                {/* Certificate Main Title */}
                <h1 className="text-xl sm:text-3xl font-black text-amber-800 mt-4 tracking-tight">
                  Certificate of Leadership & Excellence
                </h1>

                <p className="text-xs font-sans italic text-slate-500 mt-3">
                  This official honor is proudly presented and certified to:
                </p>

                {/* Recipient Name */}
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-900 mt-2 font-serif tracking-wide border-b-2 border-amber-400 pb-1 max-w-md mx-auto">
                  {formData.recipient_name || 'Club President'}
                </h2>

                <p className="text-xs font-sans font-bold text-slate-700 mt-2">
                  {formData.recipient_role} • {formData.club_name}
                </p>

                {/* Citation */}
                <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-lg mx-auto mt-4 leading-relaxed italic">
                  "{formData.citation}"
                </p>

                {/* Event Name */}
                <p className="text-xs font-sans font-bold text-brand-800 mt-3">
                  Event: {formData.event_title}
                </p>

                {/* Sign-off signatures */}
                <div className="mt-8 pt-4 border-t border-amber-200 grid grid-cols-2 gap-8 text-center font-sans">
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900">{formData.issued_by_name}</p>
                    <p className="text-[10px] text-slate-400">Dean of Student Affairs</p>
                  </div>

                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900">Prof. Alan Turing</p>
                    <p className="text-[10px] text-slate-400">Faculty Council Mentor</p>
                  </div>
                </div>

                {/* Serial ID */}
                <p className="mt-6 text-[10px] font-mono text-slate-400">
                  Certificate ID: {formData.certificate_number} • Authenticated on CEMS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
