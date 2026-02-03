/**
 * ModerationV3Panel - PRYDE_MODERATION_ROLLOUT_V4 Admin UI
 *
 * Frontend component for V4 moderation governance:
 * - Event Stream: Real-time moderation events (read-only)
 * - Rollout Status: Current phase and enabled actions
 * - Simulation: Test content through pipeline
 * - Shadow Mode: Default safe mode for observation
 *
 * V4 RULES:
 * - Shadow mode by default
 * - Read-only visibility first
 * - Admins observe before acting
 * - Frontend never recalculates moderation logic
 */

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  EXPLANATION_COPY,
  ACTION_LABELS,
  ROLLOUT_PHASES,
  getExplanationCopy
} from '../../utils/moderationCopy';
import './ModerationV3Panel.css';

// V4 Explanation labels derived from moderationCopy
const EXPLANATION_LABELS = Object.fromEntries(
  Object.entries(EXPLANATION_COPY).map(([key, val]) => [
    key,
    { text: val.message, color: val.tone === 'positive' ? 'green' : val.tone === 'warning' ? 'orange' : val.tone === 'error' ? 'red' : val.tone === 'info' ? 'blue' : 'yellow' }
  ])
);

export default function ModerationV3Panel({ showAlert, showConfirm }) {
  const [activeSection, setActiveSection] = useState('events');
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [mode, setMode] = useState('SHADOW'); // V4: Default to SHADOW
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rollout, setRollout] = useState(null); // V4: Rollout status

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
      const [eventsRes, modeRes, settingsRes, statsRes, rolloutRes] = await Promise.all([
        api.get('/admin/moderation-v2/events?limit=50'),
        api.get('/admin/moderation-v2/mode'),
        api.get('/admin/moderation-v2/settings'),
        api.get('/admin/moderation-v2/stats'),
        api.get('/admin/moderation-v2/rollout') // V4: Get rollout status
      ]);
      setEvents(eventsRes.data.events || []);
      setMode(modeRes.data.mode || 'SHADOW'); // V4: Default SHADOW
      setSettings(settingsRes.data.settings || {});
      setStats(statsRes.data.stats || {});
      setRollout(rolloutRes.data || null); // V4: Rollout data
    } catch (error) {
      console.error('Load V4 data error:', error);
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
    return <div className="v3-loading">Loading V4 Moderation Panel...</div>;
  }

  return (
    <div className="moderation-v3-panel">
      <div className="v3-header">
        <h2>🛡️ Moderation V4</h2>
        <div className="v4-status-row">
          <div className={`mode-badge ${mode.toLowerCase()}`}>
            {mode === 'LIVE' ? '🟢 LIVE' : '🟡 SHADOW'}
          </div>
          {rollout && (
            <div className="phase-badge">
              Phase {rollout.currentPhase}: {rollout.phaseName}
            </div>
          )}
        </div>
      </div>

      {/* V4: Read-only observation reminder */}
      {mode === 'SHADOW' && (
        <div className="v4-observe-banner">
          🔍 <strong>Observation Mode:</strong> All layers execute but NO penalties apply.
          Review events and tune rules before enabling enforcement.
        </div>
      )}

      <div className="v3-tabs">
        <button className={activeSection === 'events' ? 'active' : ''}
                onClick={() => setActiveSection('events')}>📋 Events</button>
        <button className={activeSection === 'rollout' ? 'active' : ''}
                onClick={() => setActiveSection('rollout')}>📊 Rollout</button>
        <button className={activeSection === 'simulate' ? 'active' : ''}
                onClick={() => setActiveSection('simulate')}>🧪 Simulate</button>
        <button className={activeSection === 'rules' ? 'active' : ''}
                onClick={() => setActiveSection('rules')}>⚙️ Rules</button>
        <button className={activeSection === 'mode' ? 'active' : ''}
                onClick={() => setActiveSection('mode')}>🎚️ Mode</button>
      </div>

      <div className="v3-content">
        {activeSection === 'events' && <EventsSection events={events} onRefresh={loadData} />}
        {activeSection === 'rollout' && <RolloutSection rollout={rollout} onRefresh={loadData} />}
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
          <ModeSection mode={mode} onToggle={handleToggleMode} stats={stats} rollout={rollout} />
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

// V4: Rollout status section
function RolloutSection({ rollout, onRefresh }) {
  if (!rollout) {
    return <div className="rollout-section"><p>Loading rollout status...</p></div>;
  }

  const phases = rollout.phases || [];
  const enabledActions = rollout.enabledActions || {};

  return (
    <div className="rollout-section">
      <div className="section-header">
        <h3>📊 Rollout Status</h3>
        <button onClick={onRefresh} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="rollout-current">
        <div className="current-phase">
          <span className="phase-number">Phase {rollout.currentPhase}</span>
          <span className="phase-name">{rollout.phaseName}</span>
        </div>
        <div className={`mode-indicator ${rollout.mode?.toLowerCase() || 'shadow'}`}>
          Mode: {rollout.mode || 'SHADOW'}
        </div>
      </div>

      <div className="v4-read-only-notice">
        <strong>🔍 Read-Only View</strong>
        <p>This panel shows the current rollout status. To enable actions, use the super_admin console with escalation.</p>
      </div>

      <div className="enabled-actions">
        <h4>Enabled Actions</h4>
        <div className="action-grid">
          {['NOTE', 'DAMPEN', 'REVIEW', 'MUTE', 'BLOCK'].map(action => (
            <div key={action} className={`action-item ${enabledActions[action] ? 'enabled' : 'disabled'}`}>
              <span className="action-icon">{ACTION_LABELS[action]?.icon}</span>
              <span className="action-name">{action}</span>
              <span className="action-status">{enabledActions[action] ? '✓' : '○'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rollout-phases">
        <h4>Rollout Phases</h4>
        <div className="phases-list">
          {phases.map(phase => (
            <div
              key={phase.phase}
              className={`phase-item ${rollout.currentPhase === phase.phase ? 'current' : ''} ${rollout.currentPhase > phase.phase ? 'completed' : ''}`}
            >
              <span className="phase-num">{phase.phase}</span>
              <span className="phase-info">
                <strong>{phase.name}</strong>
                <small>{phase.description}</small>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rollout-guidance">
        <h4>📋 Rollout Guidelines</h4>
        <ul>
          <li>Enable <strong>one action at a time</strong></li>
          <li>Observe for <strong>48-72 hours</strong> before proceeding</li>
          <li>Review false positives in Events tab</li>
          <li>Adjust rules as needed before enabling next action</li>
        </ul>
      </div>
    </div>
  );
}

function ModeSection({ mode, onToggle, stats, rollout }) {
  return (
    <div className="mode-section">
      <h3>🎚️ Moderation Mode</h3>

      <div className={`mode-display ${mode.toLowerCase()}`}>
        <span className="mode-icon">{mode === 'LIVE' ? '🟢' : '🟡'}</span>
        <span className="mode-text">{mode}</span>
      </div>

      <div className="mode-description">
        {mode === 'LIVE' ? (
          <p>Moderation is <strong>active</strong>. Enabled actions apply to users.</p>
        ) : (
          <p>Moderation is in <strong>shadow mode</strong>. All layers execute but NO penalties apply. Use this to observe before enabling enforcement.</p>
        )}
      </div>

      {/* V4: Show current phase and enabled actions */}
      {rollout && (
        <div className="mode-rollout-summary">
          <p>Current Phase: <strong>{rollout.currentPhase} - {rollout.phaseName}</strong></p>
          <p className="enabled-summary">
            Enabled: {Object.entries(rollout.enabledActions || {}).filter(([,v]) => v).map(([k]) => k).join(', ') || 'None'}
          </p>
        </div>
      )}

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
