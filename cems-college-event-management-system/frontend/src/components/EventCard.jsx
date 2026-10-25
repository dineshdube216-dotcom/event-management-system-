import React from 'react';
import { Calendar, MapPin, ExternalLink, Star, Users, CheckCircle } from 'lucide-react';

export const EventCard = ({ event, onSelect, onRegister, isRegistered }) => {
  const isOfficial = event.event_type === 'official';

  // Format date: e.g. "Sep 15, 2026 • 9:00 AM"
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
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
    <div
      onClick={() => onSelect(event)}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
        isOfficial
          ? 'border-amber-300 shadow-soft hover:shadow-card-hover hover:border-amber-400 ring-1 ring-amber-400/30'
          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Top Banner & Badge */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={
            event.banner_image_url ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
          }
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

        {/* Distinct Badge */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {isOfficial ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-400 border border-amber-300 rounded-full shadow-lg shadow-amber-500/20 animate-pulse">
              <Star className="w-3.5 h-3.5 fill-amber-900" />
              Official Event
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-wide text-brand-800 bg-white/95 backdrop-blur-md border border-brand-200 rounded-full shadow-sm">
              <Users className="w-3 h-3 text-brand-600" />
              Club Event
            </span>
          )}
        </div>

        {/* Organizer Tag on Banner */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-medium truncate max-w-[200px]">
            {event.organizer}
          </span>
          {event.registration_count > 0 && (
            <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-300">
              {event.registration_count} Registered
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slateText leading-snug group-hover:text-brand-800 transition-colors line-clamp-2">
            {event.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Event Details Meta */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 pb-5 pt-1 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(event);
          }}
          className="flex-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
        >
          View Details
        </button>

        {event.registration_link ? (
          <a
            href={event.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-2 text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
          >
            RSVP Link <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegister(event);
            }}
            disabled={isRegistered}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              isRegistered
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-brand-800 hover:bg-brand-900 text-white shadow-sm hover:shadow'
            }`}
          >
            {isRegistered ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Registered
              </>
            ) : (
              'Register'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
