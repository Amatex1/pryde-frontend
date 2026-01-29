import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EventRSVP from '../components/EventRSVP';
import EventAttendees from '../components/EventAttendees';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { getImageUrl } from '../utils/imageUrl';
import './Events.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onMenuOpen } = useOutletContext() || {};
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'in-person',
    category: 'social',
    startDate: '',
    endDate: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    virtualLink: '',
    coverImage: '',
    maxAttendees: '',
    isPrivate: false,
    tags: ''
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterType !== 'all') params.append('type', filterType);
      const res = await api.get(`/events?${params.toString()}`);
      const data = res.data ?? [];
      setEvents(Array.isArray(data) ? data : (data.events ?? []));
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        category: formData.category,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: {
          venue: formData.venue,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          virtualLink: formData.virtualLink
        },
        coverImage: formData.coverImage,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        isPrivate: formData.isPrivate,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await api.post('/events', eventData);
      setShowCreateModal(false);
      setFormData({ title: '', description: '', eventType: 'in-person', category: 'social', startDate: '', endDate: '', venue: '', address: '', city: '', country: '', virtualLink: '', coverImage: '', maxAttendees: '', isPrivate: false, tags: '' });
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await api.post(`/events/${eventId}/rsvp`, { status });
      fetchEvents();
    } catch (error) {
      console.error('Failed to RSVP:', error);
      alert(error.response?.data?.message || 'Failed to RSVP. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventCard = (event) => {
    const hasCover = !!event.coverImage;
    return (
      <div key={event._id} className="event-card">
        {hasCover && (
          <div className="event-cover">
            <img src={getImageUrl(event.coverImage)} alt={event.title} />
          </div>
        )}
        <div className="event-content">
          <div className="event-badges">
            <span className="event-badge category">{/* emoji can be added later */} {event.category}</span>
            <span className="event-badge type">{event.eventType}</span>
          </div>
          <h3 className="event-title">{event.title}</h3>
          <p className="event-description">{event.description}</p>
          <div className="event-details">
            <div className="event-detail"><span className="detail-icon">📅</span><span>{formatDate(event.startDate)}</span></div>
            {event.location?.city && (
              <div className="event-detail"><span className="detail-icon">📍</span><span>{event.location.city}, {event.location.country}</span></div>
            )}
            {event.location?.virtualLink && (
              <div className="event-detail"><span className="detail-icon">💻</span><a href={event.location.virtualLink} target="_blank" rel="noopener noreferrer">Join Online</a></div>
            )}
          </div>
          <div className="event-creator">
            <Link to={`/profile/${event.creator?.username}`} className="creator-link">
              {event.creator?.profilePhoto ? (
                <img src={getImageUrl(event.creator.profilePhoto)} alt={event.creator.username} />
              ) : (
                <span>{event.creator?.displayName?.charAt(0) ?? 'U'}</span>
              )}
              <span>{event.creator?.displayName ?? event.creator?.username}</span>
              {event.creator?.isVerified && <span className="verified-badge">✓</span>}
            </Link>
          </div>
          <EventRSVP event={event} currentUserId={currentUser?._id} onRSVPChange={() => fetchEvents()} />
          <EventAttendees event={event} />
        </div>
      </div>
    );
  };

  return (
    <div className="events-page">
      <Navbar onMenuClick={onMenuOpen} />
      <div className="events-container">
        <div className="events-header">
          <h1 className="page-title">🏳️‍🌈 LGBTQ+ Events</h1>
          <button className="btn-create-event" onClick={() => setShowCreateModal(true)}>➕ Create Event</button>
        </div>
        <div className="events-filters">
          <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="filter-select">
            <option value="all">All Categories</option>
            <option value="pride">Pride</option>
            <option value="social">Social</option>
          </select>
          <select value={filterType} onChange={(e)=>setFilterType(e.target.value)} className="filter-select">
            <option value="all">All Types</option>
            <option value="in-person">In-Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        {loading ? (
          <div className="loading">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="no-events"><p>No events found. Be the first to create one!</p></div>
        ) : (
          <div className="events-grid">{events.map((ev) => getEventCard(ev))}</div>
        )}
        {showCreateModal && (
          <div className="modal-overlay" onClick={()=>setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Event</h2>
                <button className="btn-close" onClick={()=>setShowCreateModal(false)}>×</button>
              </div>
              <form className="event-form" onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label>Event Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Enter event title" />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} required placeholder="Describe your event" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Type *</label>
                    <select name="eventType" value={formData.eventType} onChange={handleInputChange} required>
                      <option value="in-person">In-Person</option>
                      <option value="virtual">Virtual</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      <option value="social">Social</option>
                      <option value="pride">Pride</option>
                      <option value="support-group">Support Group</option>
                      <option value="activism">Activism</option>
                      <option value="education">Education</option>
                      <option value="arts">Arts</option>
                      <option value="sports">Sports</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date & Time *</label>
                    <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>End Date & Time *</label>
                    <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Location (City)</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g., London, New York" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={()=>setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-submit">Create Event</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;
