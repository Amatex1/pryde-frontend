/**
 * ModerationV3Panel - PRYDE_MODERATION_PLATFORM_V3 Admin UI
 * 
 * Frontend component for V3 moderation governance:
 * - Event Stream: Real-time moderation events
 * - User Profiles: Per-user moderation history
 * - Rule Tuning: Admin-configurable thresholds
 * - Simulation: Test content through pipeline
 * - Shadow Mode Toggle: LIVE/SHADOW mode control
 * 
 * DATA CONTRACT: Frontend never recalculates moderation logic.
 * All display values come directly from backend V3 contract.
 */

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ModerationV3Panel.css';

// V3 Explanation code mappings (human-first language)
const EXPLANATION_LABELS = {
  ALLOWED: { text: 'Content allowed', color: 'green' },
  EXPRESSIVE_ALLOWED: { text: 'Expressive formatting detected. No action taken.', color: 'green' },
  FLAGGED_FOR_MONITORING: { text: 'Flagged for monitoring', color: 'yellow' },
  VISIBILITY_DAMPENED: { text: 'Visibility briefly reduced to prevent feed flooding.', color: 'orange' },
  FREQUENCY_DAMPENED: { text: 'Posting frequency noticed. Brief adjustment.', color: 'orange' },
  QUEUED_FOR_REVIEW: { text: 'Queued for human review.', color: 'blue' },
  NEEDS_CONTEXT_CHECK: { text: 'Context check needed.', color: 'blue' },
  TEMPORARILY_MUTED: { text: 'Brief pause applied.', color: 'red' },
  COOLDOWN_APPLIED: { text: 'Cooldown active.', color: 'red' },
  CONTENT_BLOCKED: { text: 'Content not posted.', color: 'red' },
  SAFETY_TRIGGERED: { text: 'Safety check triggered.', color: 'red' }
};

// V3 Action display
const ACTION_LABELS = {
  ALLOW: { icon: '✅', text: 'Allowed', color: 'green' },
  NOTE: { icon: '📝', text: 'Note', color: 'yellow' },
  DAMPEN: { icon: '🔉', text: 'Dampened', color: 'orange' },
  REVIEW: { icon: '👀', text: 'Review', color: 'blue' },
  MUTE: { icon: '🔇', text: 'Muted', color: 'red' },
  BLOCK: { icon: '🚫', text: 'Blocked', color: 'red' }
};

export default function ModerationV3Panel({ showAlert, showConfirm }) {
  const [activeSection, setActiveSection] = useState('events');
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [mode, setMode] = useState('LIVE');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Simulation state
  const [simContent, setSimContent] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, modeRes, settingsRes, statsRes] = await Promise.all([
        api.get('/admin/moderation-v2/events?limit=50'),
        api.get('/admin/moderation-v2/mode'),
        api.get('/admin/moderation-v2/settings'),
        api.get('/admin/moderation-v2/stats')
      ]);
      setEvents(eventsRes.data.events || []);
      setMode(modeRes.data.mode || 'LIVE');
      setSettings(settingsRes.data.settings || {});
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Load V3 data error:', error);
      showAlert?.('Failed to load moderation data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = async () => {
    const newMode = mode === 'LIVE' ? 'SHADOW' : 'LIVE';
    const confirmed = await showConfirm?.(
      `Switch to ${newMode} mode? ${newMode === 'SHADOW' 
        ? 'All layers will execute but NO penalties will apply.' 
        : 'Penalties will apply to users.'}`,
      'Change Moderation Mode',
      `Switch to ${newMode}`,
      'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.put('/admin/moderation-v2/mode', { mode: newMode });
      setMode(newMode);
      showAlert?.(`Moderation mode set to ${newMode}`, 'Success');
    } catch (error) {
      showAlert?.(error.response?.data?.message || 'Failed to change mode', 'Error');
    }
  };

  const handleSimulate = async () => {
    if (!simContent.trim()) return;
    setSimulating(true);
    try {
      const res = await api.post('/admin/moderation-v2/simulate', {
        content: simContent,
        contentType: 'post'
      });
      setSimResult(res.data.event);
    } catch (error) {
      showAlert?.(error.response?.data?.message || 'Simulation failed', 'Error');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <div className="v3-loading">Loading V3 Moderation Panel...</div>;
  }

  return (
    <div className="moderation-v3-panel">
      <div className="v3-header">
        <h2>🛡️ Moderation V3</h2>
        <div className={`mode-badge ${mode.toLowerCase()}`}>
          {mode === 'LIVE' ? '🟢 LIVE' : '🟡 SHADOW'}
        </div>
      </div>

      <div className="v3-tabs">
        <button className={activeSection === 'events' ? 'active' : ''} 
                onClick={() => setActiveSection('events')}>📋 Events</button>
        <button className={activeSection === 'rules' ? 'active' : ''} 
                onClick={() => setActiveSection('rules')}>⚙️ Rules</button>
        <button className={activeSection === 'simulate' ? 'active' : ''} 
                onClick={() => setActiveSection('simulate')}>🧪 Simulate</button>
        <button className={activeSection === 'mode' ? 'active' : ''} 
                onClick={() => setActiveSection('mode')}>🎚️ Mode</button>
      </div>

      <div className="v3-content">
        {activeSection === 'events' && <EventsSection events={events} onRefresh={loadData} />}
        {activeSection === 'rules' && <RulesSection settings={settings} onRefresh={loadData} showAlert={showAlert} />}
        {activeSection === 'simulate' && (
          <SimulateSection
            content={simContent}
            setContent={setSimContent}
            result={simResult}
            onSimulate={handleSimulate}
            simulating={simulating}
          />
        )}
        {activeSection === 'mode' && (
          <ModeSection mode={mode} onToggle={handleToggleMode} stats={stats} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function EventsSection({ events, onRefresh }) {
  return (
    <div className="events-section">
      <div className="section-header">
        <h3>📋 Recent Moderation Events</h3>
        <button onClick={onRefresh} className="refresh-btn">🔄 Refresh</button>
      </div>
      {events.length === 0 ? (
        <div className="empty-state">No moderation events yet</div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <EventCard key={event.id || event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const action = ACTION_LABELS[event.response?.action] || ACTION_LABELS.ALLOW;
  const explanation = EXPLANATION_LABELS[event.explanationCode] || { text: event.explanationCode, color: 'gray' };

  return (
    <div className={`event-card ${event.shadowMode ? 'shadow-event' : ''}`}>
      <div className="event-header">
        <span className={`action-badge ${action.color}`}>{action.icon} {action.text}</span>
        <span className="event-time">{new Date(event.createdAt).toLocaleString()}</span>
        {event.shadowMode && <span className="shadow-badge">SHADOW</span>}
      </div>
      <div className="event-content">
        <p className="content-preview">{event.contentPreview || '(no preview)'}</p>
      </div>
      <div className="event-details">
        <span className="detail">Type: {event.contentType}</span>
        <span className="detail">Intent: {event.intent?.category || 'N/A'}</span>
        <span className="detail">Confidence: {Math.round((event.confidence || 0) * 100)}%</span>
      </div>
      <div className={`event-explanation ${explanation.color}`}>{explanation.text}</div>
    </div>
  );
}

function RulesSection({ settings, onRefresh, showAlert }) {
  const [localSettings, setLocalSettings] = useState(settings?.moderationV2 || {});
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/moderation-v2/settings', localSettings);
      showAlert?.('Settings saved - effective immediately for new content', 'Success');
      onRefresh();
    } catch (error) {
      showAlert?.(error.response?.data?.message || 'Failed to save', 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rules-section">
      <h3>⚙️ Rule Tuning</h3>
      <p className="rules-note">Changes affect future events only. No retroactive adjustments.</p>

      <div className="rule-group">
        <label>Expressive Tolerance (0-100)</label>
        <input type="range" min="0" max="100"
          value={localSettings.expressiveTolerance || 50}
          onChange={e => handleChange('expressiveTolerance', parseInt(e.target.value))} />
        <span>{localSettings.expressiveTolerance || 50}%</span>
      </div>

      <div className="rule-group">
        <label>Behavior Escalation Sensitivity (0-100)</label>
        <input type="range" min="0" max="100"
          value={localSettings.behaviorEscalationSensitivity || 50}
          onChange={e => handleChange('behaviorEscalationSensitivity', parseInt(e.target.value))} />
        <span>{localSettings.behaviorEscalationSensitivity || 50}%</span>
      </div>

      <div className="rule-group">
        <label>New Account Strictness (0-100)</label>
        <input type="range" min="0" max="100"
          value={localSettings.newAccountStrictness || 50}
          onChange={e => handleChange('newAccountStrictness', parseInt(e.target.value))} />
        <span>{localSettings.newAccountStrictness || 50}%</span>
      </div>

      <div className="rule-group">
        <label>Review Threshold (0-100)</label>
        <input type="range" min="0" max="100"
          value={localSettings.reviewThreshold || 60}
          onChange={e => handleChange('reviewThreshold', parseInt(e.target.value))} />
        <span>{localSettings.reviewThreshold || 60}%</span>
      </div>

      <button onClick={handleSave} disabled={saving} className="save-btn">
        {saving ? 'Saving...' : '💾 Save Rules'}
      </button>
    </div>
  );
}

function SimulateSection({ content, setContent, result, onSimulate, simulating }) {
  return (
    <div className="simulate-section">
      <h3>🧪 Simulation Mode</h3>
      <p className="sim-note">Test content through the moderation pipeline without affecting users.</p>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Enter content to simulate..."
        rows={4}
        className="sim-input"
      />

      <button onClick={onSimulate} disabled={simulating || !content.trim()} className="sim-btn">
        {simulating ? 'Running...' : '▶️ Run Simulation'}
      </button>

      {result && (
        <div className="sim-result">
          <h4>Simulation Result</h4>
          <EventCard event={result} />
        </div>
      )}
    </div>
  );
}

function ModeSection({ mode, onToggle, stats }) {
  return (
    <div className="mode-section">
      <h3>🎚️ Moderation Mode</h3>

      <div className={`mode-display ${mode.toLowerCase()}`}>
        <span className="mode-icon">{mode === 'LIVE' ? '🟢' : '🟡'}</span>
        <span className="mode-text">{mode}</span>
      </div>

      <div className="mode-description">
        {mode === 'LIVE' ? (
          <p>Moderation is <strong>active</strong>. All penalties apply to users.</p>
        ) : (
          <p>Moderation is in <strong>shadow mode</strong>. All layers execute but NO penalties apply. Use this to test rule changes safely.</p>
        )}
      </div>

      <button onClick={onToggle} className={`mode-toggle-btn ${mode.toLowerCase()}`}>
        Switch to {mode === 'LIVE' ? 'SHADOW' : 'LIVE'} Mode
      </button>

      {stats && (
        <div className="mode-stats">
          <h4>📊 Stats (24h)</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalEvents || 0}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.shadowEvents || 0}</span>
              <span className="stat-label">Shadow Events</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
