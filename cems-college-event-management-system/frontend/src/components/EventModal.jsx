import React from 'react';
import { X, Calendar, MapPin, ExternalLink, CheckCircle, Star, Users, Building, Share2 } from 'lucide-react';

export const EventModal = ({ event, onClose, onRegister, isRegistered }) => {
  if (!event) return null;

  const isOfficial = event.event_type === 'official';

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header Banner */}
        <div className="relative h-64 w-full bg-slate-900">
          <img
            src={event.banner_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
            alt={event.title}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border border-white/20 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Title */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {isOfficial ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-400 rounded-full shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-900" /> Official Event
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-brand-700/80 backdrop-blur-md rounded-full border border-white/20">
                  <Users className="w-3.5 h-3.5" /> Club Event
                </span>
              )}
              <span className="text-xs text-slate-300 font-medium">
                Hosted by {event.organizer}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">{event.title}</h2>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date & Time</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{formatDate(event.event_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location / Venue</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About This Event</h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {/* Details Metadata */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              <span>Category: <strong className="text-slate-700 capitalize">{event.event_type} Announcement</strong></span>
            </div>
            {event.registration_count !== undefined && (
              <span>Attending: <strong className="text-brand-700 font-bold">{event.registration_count} Students</strong></span>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>

          {event.registration_link ? (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 text-sm font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              Open External Registration Portal <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={() => onRegister(event)}
              disabled={isRegistered}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                isRegistered
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                  : 'bg-brand-800 hover:bg-brand-900 text-white shadow-md shadow-brand-900/20'
              }`}
            >
              {isRegistered ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> You Are Registered!
                </>
              ) : (
                'Confirm Event Registration'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
