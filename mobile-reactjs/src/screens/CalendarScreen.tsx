import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'feather-icons-react';
import AppHeader from '../components/AppHeader';
import { announcementService, isAdminUser } from '../services/api';
import './CalendarScreen.css';

type TaggedUser = { _id: string; firstName: string; lastName: string };
type Announcement = {
  _id: string;
  title?: string;
  content: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  authorName: string;
  publishedAt: string;
  url?: string;
  images?: { name: string; data: string }[];
  taggedUsers?: TaggedUser[];
};
type CalendarDay = { key: string; day: number; inMonth: boolean };

const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const localDateKey = (date: Date) => dateKey(date.getFullYear(), date.getMonth(), date.getDate());
const formatTime = (value?: string) => {
  if (!value) return '';
  const [hour, minute] = value.split(':').map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
};

const CalendarScreen: React.FC = () => {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(today));
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Announcement | null>(null);
  const navigate = useNavigate();
  const admin = isAdminUser();

  useEffect(() => {
    let active = true;
    announcementService.list()
      .then(response => { if (active) setAnnouncements(response.data?.announcements || []); })
      .catch((err: any) => { if (active) setError(err?.response?.data?.message || 'Could not load calendar events'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const eventMap = useMemo(() => {
    const map = new Map<string, Announcement[]>();
    announcements.forEach(item => {
      if (!item.eventDate) return;
      const events = map.get(item.eventDate) || [];
      events.push(item);
      map.set(item.eventDate, events);
    });
    map.forEach(events => events.sort((a, b) => (a.eventStartTime || '').localeCompare(b.eventStartTime || '') || a.title?.localeCompare(b.title || '') || 0));
    return map;
  }, [announcements]);

  const days = useMemo<CalendarDay[]>(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstDayOffset + 1;
      const inMonth = day >= 1 && day <= daysInMonth;
      return { key: inMonth ? dateKey(year, monthIndex, day) : '', day: inMonth ? day : 0, inMonth };
    });
  }, [month]);

  const selectedEvents = eventMap.get(selectedDate) || [];
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const goToMonth = (offset: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  };
  const goToToday = () => {
    const current = new Date();
    setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedDate(localDateKey(current));
  };

  return <div className="calendar-screen">
    <AppHeader title="Calendar" />
    <main className="calendar-main">
      <section className="calendar-panel" aria-label="Monthly calendar">
        <div className="calendar-month-heading">
          <button type="button" className="calendar-nav-button" onClick={() => goToMonth(-1)} aria-label="Previous month">‹</button>
          <h2>{monthLabel}</h2>
          <button type="button" className="calendar-nav-button" onClick={() => goToMonth(1)} aria-label="Next month">›</button>
          <button type="button" className="calendar-today-button" onClick={goToToday}>Today</button>
        </div>
        <div className="calendar-grid calendar-weekdays" aria-hidden="true">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid calendar-days">
          {days.map((day, index) => {
            if (!day.inMonth) return <span key={`empty-${index}`} className="calendar-day-empty" aria-hidden="true" />;
            const eventCount = eventMap.get(day.key)?.length || 0;
            const isToday = day.key === localDateKey(today);
            const selected = day.key === selectedDate;
            return <button type="button" key={day.key} className={`calendar-day${isToday ? ' is-today' : ''}${selected ? ' is-selected' : ''}${eventCount ? ' has-events' : ''}`} aria-label={`${formatDate(day.key, { dateStyle: 'full' })}${eventCount ? `, ${eventCount} ${eventCount === 1 ? 'event' : 'events'}` : ''}`} aria-pressed={selected} onClick={() => setSelectedDate(day.key)}>
              <span>{day.day}</span>{eventCount > 0 && <span className="calendar-event-dots" aria-label={`${eventCount} events`}>{Array.from({ length: Math.min(eventCount, 3) }, (_, dot) => <i key={dot} />)}{eventCount > 3 && <b>+</b>}</span>}
            </button>;
          })}
        </div>
        <div className="calendar-legend"><span className="calendar-legend-dot" /> Event scheduled</div>
      </section>

      <section className="calendar-events" aria-live="polite">
        <h2>{formatDate(selectedDate)}</h2>
        {loading ? <p className="calendar-empty">Loading events…</p> : error ? <p className="calendar-error" role="alert">{error}</p> : selectedEvents.length === 0 ? <><p className="calendar-empty">No family events planned for this date.</p>{admin && <button type="button" className="calendar-create-event" onClick={() => navigate('/announcements', { state: { openCreateAnnouncement: true } })}>＋ Create event announcement</button>}</> : selectedEvents.map(event => <button type="button" key={event._id} className="calendar-event-card" onClick={() => setSelectedEvent(event)}>
          <span className="calendar-event-time">{event.eventStartTime ? formatTime(event.eventStartTime) : 'All day'}{event.eventEndTime ? ` – ${formatTime(event.eventEndTime)}` : ''}</span>
          <span className="calendar-event-title">{event.title || 'Family announcement'}</span>
          <span className="calendar-event-author">Posted by {event.authorName}</span>
          <span className="calendar-event-open">View details →</span>
        </button>)}
      </section>
    </main>

    {selectedEvent && <div className="calendar-modal-backdrop" role="presentation" onClick={() => setSelectedEvent(null)}>
      <section className="calendar-event-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-event-modal-title" onClick={event => event.stopPropagation()}>
        <button className="calendar-modal-close" aria-label="Close event details" type="button" onClick={() => setSelectedEvent(null)}><X size={20} /></button>
        <span className="calendar-modal-date">{formatDate(selectedEvent.eventDate || selectedDate)}{selectedEvent.eventStartTime ? ` · ${formatTime(selectedEvent.eventStartTime)}` : ' · All day'}{selectedEvent.eventEndTime ? ` – ${formatTime(selectedEvent.eventEndTime)}` : ''}</span>
        <h2 id="calendar-event-modal-title">{selectedEvent.title || 'Family announcement'}</h2>
        <p className="calendar-modal-author">Posted by {selectedEvent.authorName}</p>
        {selectedEvent.content && <p className="calendar-modal-content">{selectedEvent.content}</p>}
        {!!selectedEvent.images?.length && <div className="calendar-modal-images">{selectedEvent.images.map((image, index) => <img key={`${selectedEvent._id}-${index}`} src={image.data} alt={image.name || 'Event image'} />)}</div>}
        {selectedEvent.url && <a className="calendar-modal-link" href={selectedEvent.url} target="_blank" rel="noopener noreferrer">Open event link ↗</a>}
        {!!selectedEvent.taggedUsers?.length && <p className="calendar-modal-tags">Tagged: {selectedEvent.taggedUsers.map(user => `${user.firstName} ${user.lastName}`).join(', ')}</p>}
        <button type="button" className="calendar-view-announcement" onClick={() => navigate(`/announcements#announcement-${selectedEvent._id}`)}>View Announcement</button>
      </section>
    </div>}
  </div>;
};

export default CalendarScreen;
