/**
 * ModerationV3Panel - PRYDE_MODERATION_SAFE_ROLLOUT_V5 Admin UI
 *
 * Frontend component for V5 moderation governance:
 * - Event Stream: Real-time moderation events (read-only)
 * - Rollout Status: Current phase and enabled actions
 * - Simulation: Test content through pipeline
 *
 * V5 SAFE ROLLOUT RULES:
 * - Shadow mode by default (7-day minimum observation)
 * - TRULY READ-ONLY: No mode toggle, no enforcement controls
 * - Limited to NOTE and DAMPEN only
 * - Admins observe before any enforcement
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

export default function ModerationV3Panel({ showAlert }) {
  const [activeSection, setActiveSection] = useState('events');
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [mode, setMode] = useState('SHADOW'); // V5: Default to SHADOW, read-only
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rollout, setRollout] = useState(null); // V5: Rollout status

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
        api.get('/admin/moderation-v2/rollout') // V5: Get rollout status
      ]);
      setEvents(eventsRes.data.events || []);
      setMode(modeRes.data.mode || 'SHADOW'); // V5: Default SHADOW
      setSettings(settingsRes.data.settings || {});
      setStats(statsRes.data.stats || {});
      setRollout(rolloutRes.data || null); // V5: Rollout data
    } catch (error) {
      console.error('Load V5 data error:', error);
      showAlert?.('Failed to load moderation data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // V5: Mode toggle REMOVED - read-only panel

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
    return <div className="v3-loading">Loading V5 Moderation Panel...</div>;
  }

  return (
    <div className="moderation-v3-panel">
      <div className="v3-header">
        <h2>🛡️ Moderation V5 (Safe Rollout)</h2>
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

      {/* V5: 7-day observation period guidance */}
      <div className="v5-observation-guidance">
        <h4>📋 V5 Safe Rollout Process</h4>
        <ol>
          <li><strong>Phase 0 (Shadow):</strong> All layers execute, no penalties. Observe for 7 days minimum.</li>
          <li><strong>Phase 1 (Logging):</strong> NOTE action enabled. Observe for 48-72 hours.</li>
          <li><strong>Phase 2 (Dampening):</strong> DAMPEN enabled (non-punitive). STOP and observe.</li>
        </ol>
        <p className="v5-warning">⚠️ Do not enable additional actions until false positives are rare and admins trust the system.</p>
      </div>

      {/* V5: Read-only observation reminder */}
      {mode === 'SHADOW' && (
        <div className="v4-observe-banner">
          🔍 <strong>Shadow Mode Active:</strong> All layers execute but NO penalties apply.
          Review events below before considering any enforcement.
        </div>
      )}

      {/* V5: Removed Mode tab - truly read-only */}
      <div className="v3-tabs">
        <button className={activeSection === 'events' ? 'active' : ''}
                onClick={() => setActiveSection('events')}>📋 Events</button>
        <button className={activeSection === 'rollout' ? 'active' : ''}
                onClick={() => setActiveSection('rollout')}>📊 Rollout</button>
        <button className={activeSection === 'simulate' ? 'active' : ''}
                onClick={() => setActiveSection('simulate')}>🧪 Simulate</button>
        <button className={activeSection === 'status' ? 'active' : ''}
                onClick={() => setActiveSection('status')}>📈 Status</button>
      </div>

      <div className="v3-content">
        {activeSection === 'events' && <EventsSection events={events} onRefresh={loadData} />}
        {activeSection === 'rollout' && <RolloutSection rollout={rollout} onRefresh={loadData} />}
        {activeSection === 'simulate' && (
          <SimulateSection
            content={simContent}
            setContent={setSimContent}
            result={simResult}
            onSimulate={handleSimulate}
            simulating={simulating}
          />
        )}
        {activeSection === 'status' && (
          <StatusSection mode={mode} stats={stats} rollout={rollout} />
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

// V5: Rollout status section - read-only, NOTE/DAMPEN only
function RolloutSection({ rollout, onRefresh }) {
  if (!rollout) {
    return <div className="rollout-section"><p>Loading rollout status...</p></div>;
  }

  const phases = rollout.phases || [];
  const enabledActions = rollout.enabledActions || {};

  // V5: Only show NOTE and DAMPEN actions
  const v5Actions = ['NOTE', 'DAMPEN'];

  return (
    <div className="rollout-section">
      <div className="section-header">
        <h3>📊 Rollout Status (V5 Safe Rollout)</h3>
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
        <strong>🔒 Read-Only Panel</strong>
        <p>V5 Safe Rollout is limited to observation only. No enforcement controls are available in this UI.</p>
      </div>

      <div className="enabled-actions">
        <h4>V5 Actions (NOTE + DAMPEN only)</h4>
        <div className="action-grid v5-grid">
          {v5Actions.map(action => (
            <div key={action} className={`action-item ${enabledActions[action] ? 'enabled' : 'disabled'}`}>
              <span className="action-icon">{ACTION_LABELS[action]?.icon}</span>
              <span className="action-name">{action}</span>
              <span className="action-status">{enabledActions[action] ? '✓ Enabled' : '○ Disabled'}</span>
            </div>
          ))}
        </div>
        <p className="v5-reserved-note">
          <em>REVIEW, MUTE, BLOCK are reserved for future phases after system is proven stable.</em>
        </p>
      </div>

      <div className="rollout-phases">
        <h4>V5 Rollout Phases</h4>
        <div className="phases-list">
          {phases.slice(0, 3).map(phase => (
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
        <h4>📋 V5 Rollout Guidelines</h4>
        <ul>
          <li>Shadow mode first - observe for <strong>7 days minimum</strong></li>
          <li>Enable <strong>one action at a time</strong></li>
          <li>Observe for <strong>48-72 hours</strong> between phases</li>
          <li>Review false positives in Events tab</li>
          <li><strong>STOP after DAMPEN</strong> - do not proceed further until system is trusted</li>
        </ul>
      </div>
    </div>
  );
}

// V5: Read-only status section (replaces ModeSection)
function StatusSection({ mode, stats, rollout }) {
  return (
    <div className="mode-section">
      <h3>📈 System Status (Read-Only)</h3>

      <div className={`mode-display ${mode.toLowerCase()}`}>
        <span className="mode-icon">{mode === 'LIVE' ? '🟢' : '🟡'}</span>
        <span className="mode-text">{mode}</span>
      </div>

      <div className="mode-description">
        {mode === 'LIVE' ? (
          <p>Moderation is <strong>active</strong>. Enabled actions (NOTE, DAMPEN only) apply to content.</p>
        ) : (
          <p>Moderation is in <strong>shadow mode</strong>. All layers execute but NO penalties apply.</p>
        )}
      </div>

      {/* V5: Show current phase and enabled actions (read-only) */}
      {rollout && (
        <div className="mode-rollout-summary">
          <p>Current Phase: <strong>{rollout.currentPhase} - {rollout.phaseName}</strong></p>
          <p className="enabled-summary">
            Enabled: {Object.entries(rollout.enabledActions || {})
              .filter(([k, v]) => v && ['NOTE', 'DAMPEN'].includes(k))
              .map(([k]) => k).join(', ') || 'None'}
          </p>
        </div>
      )}

      {/* V5: No toggle button - read-only */}
      <div className="v5-read-only-banner">
        <strong>🔒 Read-Only Panel</strong>
        <p>Mode changes are not available in V5 Safe Rollout UI. Contact super_admin for system changes.</p>
      </div>

      {stats && (
        <div className="mode-stats">
          <h4>📊 Stats (24h)</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalEvents || 0}</span>
              <span className="stat-label">Total Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.shadowEvents || 0}</span>
              <span className="stat-label">Shadow Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.noteActions || 0}</span>
              <span className="stat-label">NOTE Actions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.dampenActions || 0}</span>
              <span className="stat-label">DAMPEN Actions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
