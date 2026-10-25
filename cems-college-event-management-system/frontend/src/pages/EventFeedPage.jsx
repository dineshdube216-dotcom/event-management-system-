import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Navbar } from '../components/Navbar';
import { EventCard } from '../components/EventCard';
import { EventModal } from '../components/EventModal';
import { SkeletonCard } from '../components/SkeletonCard';
import { 
  Sparkles, 
  Calendar, 
  Star, 
  Users, 
  Search, 
  RotateCcw, 
  Megaphone,
  Layers,
  Radio,
} from 'lucide-react';

export const EventFeedPage = () => {
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'official' | 'club'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'event_date'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState('');

  // Fetch events feed
  const fetchEvents = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterType !== 'all') queryParams.append('type', filterType);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (sortBy) queryParams.append('sort', sortBy);

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/events?${queryParams.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        // Pre-populate registered ids for current user
        const regSet = new Set();
        data.events.forEach((e) => {
          if (e.is_registered) regSet.add(e.event_id);
        });
        setRegisteredIds(regSet);
      }
    } catch (err) {
      console.error('Fetch feed error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery, sortBy, token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time synchronization
  useEffect(() => {
    // When an event is published by admin, add/update in live feed
    const unsubPub = subscribe('EVENT_PUBLISHED', (data) => {
      console.log('⚡ Real-time Event Published in Student Feed:', data);
      setToastMessage(`📢 New Event Published: "${data.title}"`);
      setTimeout(() => setToastMessage(''), 4000);
      fetchEvents();
    });

    // When someone registers or cancels registration, update counter live!
    const unsubReg = subscribe('REGISTRATION_UPDATED', (data) => {
      console.log('⚡ Real-time Registration Updated:', data);
      setEvents((prev) =>
        prev.map((e) =>
          e.event_id === data.event_id
            ? { ...e, registration_count: data.registration_count }
            : e
        )
      );
    });

    return () => {
      unsubPub();
      unsubReg();
    };
  }, [subscribe, fetchEvents]);

  // Handle Event Registration
  const handleRegister = async (event) => {
    if (!token) {
      setToastMessage('Please log in to register for events.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/events/${event.event_id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setRegisteredIds((prev) => new Set([...prev, event.event_id]));
        setToastMessage(`🎉 Confirmed! You are registered for "${event.title}"`);
      } else {
        setToastMessage(`⚠️ ${data.message}`);
      }
    } catch (err) {
      setToastMessage('Error registering for event.');
    } finally {
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Sticky Navbar with live sync & notifications */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Hero Card */}
        <div className="relative rounded-3xl bg-brand-800 p-6 sm:p-10 text-white shadow-xl overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 text-xs font-bold uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" /> Centralized University Feed
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              College Event Feed & Announcements
            </h1>
            <p className="text-brand-100 text-xs sm:text-sm leading-relaxed">
              Explore verified official university announcements and student club hackathons in one centralized place with instant real-time synchronization.
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> All Announcements
            </button>

            <button
              onClick={() => setFilterType('official')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                filterType === 'official'
                  ? 'bg-amber-400 text-amber-950 font-extrabold shadow-md ring-2 ring-amber-400/40'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> Official Events (Highlighted)
            </button>

            <button
              onClick={() => setFilterType('club')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                filterType === 'club'
                  ? 'bg-brand-800 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-brand-600" /> Club Events
            </button>
          </div>

          {/* Search input for mobile & sort controls */}
          <div className="flex items-center gap-3">
            {/* Mobile Search input */}
            <div className="relative flex-1 sm:hidden">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="newest">Newest First</option>
                <option value="event_date">Event Date (Upcoming)</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.event_id}
                event={event}
                onSelect={(evt) => setSelectedEvent(evt)}
                onRegister={handleRegister}
                isRegistered={registeredIds.has(event.event_id)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No events found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              We couldn't find any announcements matching your current search or filter criteria.
            </p>
            <button
              onClick={() => {
                setFilterType('all');
                setSearchQuery('');
              }}
              className="mt-5 px-4 py-2 bg-brand-50 text-brand-800 text-xs font-bold rounded-xl border border-brand-200 hover:bg-brand-100 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 College Event Management System (CEMS). Fully Connected Live Platform.</p>
      </footer>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegister={handleRegister}
          isRegistered={registeredIds.has(selectedEvent.event_id)}
        />
      )}

    </div>
  );
};
