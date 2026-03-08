import { useState, useEffect } from 'react';
import api from '../../utils/api';

/**
 * AdminModeration - Moderation settings component
 */
function AdminModeration({ settings, history, onRefresh, showAlert, showConfirm, showPrompt }) {
  const [activeSection, setActiveSection] = useState('settings');
  const [newWord, setNewWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [isUpdating, setIsUpdating] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleUpdateSettings = async () => {
    if (!localSettings) return;
    setIsUpdating(true);
    try {
      await api.put('/admin/moderation/settings', {
        autoMute: localSettings.autoMute,
        toxicity: localSettings.toxicity
      });
      showAlert('Settings updated successfully', 'Success');
      onRefresh();
    } catch (error) {
      console.error('Update settings error:', error);
      showAlert(error.response?.data?.message || 'Failed to update settings', 'Error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    try {
      await api.post('/admin/moderation/blocked-words', {
        word: newWord.trim(),
        category: selectedCategory
      });
      showAlert(`Word "${newWord}" added to ${selectedCategory}`, 'Success');
      setNewWord('');
      onRefresh();
    } catch (error) {
      console.error('Add word error:', error);
      showAlert(error.response?.data?.message || 'Failed to add word', 'Error');
    }
  };

  const handleRemoveWord = async (word, category) => {
    const confirmed = await showConfirm(
      `Remove "${word}" from ${category}?`,
      'Remove Word', 'Remove', 'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.delete('/admin/moderation/blocked-words', {
        data: { word, category }
      });
      showAlert(`Word "${word}" removed`, 'Success');
      onRefresh();
    } catch (error) {
      console.error('Remove word error:', error);
      showAlert(error.response?.data?.message || 'Failed to remove word', 'Error');
    }
  };

  if (!localSettings) {
    return <div className="loading-state">Loading moderation settings...</div>;
  }

  return (
    <div className="moderation-container">
      <h2>🔧 Moderation Settings</h2>

      <div className="moderation-sections">
        <button
          className={`section-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          ⚙️ Settings
        </button>
        <button
          className={`section-tab ${activeSection === 'words' ? 'active' : ''}`}
          onClick={() => setActiveSection('words')}
        >
          🚫 Blocked Words
        </button>
        <button
          className={`section-tab ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          📜 History
        </button>
      </div>

      {activeSection === 'settings' && (
        <div className="moderation-settings">
          <div className="settings-section">
            <h3>🔇 Auto-Mute Configuration</h3>

            <div className="setting-row setting-row-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localSettings.autoMute?.enabled ?? true}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    autoMute: { ...localSettings.autoMute, enabled: e.target.checked }
                  })}
                />
                <span>Enable Auto-Mute</span>
              </label>
              <p className="setting-help">When enabled, users are automatically muted after repeated violations.</p>
            </div>

            <div className="setting-row">
              <label>Violation Threshold (mute after X violations):</label>
              <input
                type="number"
                min="1"
                max="10"
                value={localSettings.autoMute?.violationThreshold ?? 3}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, violationThreshold: parseInt(e.target.value) }
                })}
              />
            </div>

            <div className="setting-row">
              <label>Minutes per Violation:</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={localSettings.autoMute?.minutesPerViolation ?? 30}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, minutesPerViolation: parseInt(e.target.value) }
                })}
              />
            </div>

            <div className="setting-row">
              <label>Max Mute Duration (minutes):</label>
              <input
                type="number"
                min="60"
                max="10080"
                value={localSettings.autoMute?.maxMuteDuration ?? 1440}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, maxMuteDuration: parseInt(e.target.value) }
                })}
              />
            </div>

            <div className="setting-row">
              <label>Spam Mute Duration (minutes):</label>
              <input
                type="number"
                min="15"
                max="1440"
                value={localSettings.autoMute?.spamMuteDuration ?? 60}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  autoMute: { ...localSettings.autoMute, spamMuteDuration: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>☠️ Toxicity Scoring</h3>
            <p className="section-help">Toxicity score is calculated per-post. Higher scores = more toxic content.</p>

            <div className="setting-row">
              <label>Points per Blocked Word:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={localSettings.toxicity?.pointsPerBlockedWord ?? 10}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  toxicity: { ...localSettings.toxicity, pointsPerBlockedWord: parseInt(e.target.value) }
                })}
              />
            </div>

            <div className="setting-row">
              <label>Points for Spam:</label>
              <input
                type="number"
                min="5"
                max="50"
                value={localSettings.toxicity?.pointsForSpam ?? 20}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  toxicity: { ...localSettings.toxicity, pointsForSpam: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <button
            className="btn-save-settings"
            onClick={handleUpdateSettings}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      )}

      {activeSection === 'words' && (
        <div className="blocked-words-section">
          <div className="add-word-form">
            <h3>Add Blocked Word</h3>
            <div className="add-word-row">
              <input
                type="text"
                placeholder="Enter word or phrase..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="custom">Custom</option>
                <option value="profanity">Profanity</option>
                <option value="slurs">Slurs</option>
                <option value="sexual">Sexual</option>
                <option value="spam">Spam</option>
              </select>
              <button onClick={handleAddWord}>➕ Add</button>
            </div>
          </div>

          {['profanity', 'slurs', 'sexual', 'spam', 'custom'].map(category => (
            <div key={category} className="word-category">
              <h4>{category.charAt(0).toUpperCase() + category.slice(1)} ({localSettings.blockedWords?.[category]?.length || 0})</h4>
              <div className="word-list">
                {(localSettings.blockedWords?.[category] || []).map(word => (
                  <span key={word} className="word-tag">
                    {word}
                    <button
                      className="remove-word-btn"
                      onClick={() => handleRemoveWord(word, category)}
                      title="Remove word"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(!localSettings.blockedWords?.[category] || localSettings.blockedWords[category].length === 0) && (
                  <span className="empty-category">No words in this category</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'history' && (
        <div className="moderation-history">
          <h3>Recent Moderation Actions</h3>
          {history.length === 0 ? (
            <p className="empty-state">No moderation history found</p>
          ) : (
            <div className="history-cards">
              {history.map((entry, index) => (
                <div key={index} className="history-card">
                  <div className="history-card-header">
                    <div className="history-card-user">
                      <span className="history-user-name">
                        {entry.displayName || entry.username}
                      </span>
                      <span className={`action-badge action-${entry.action}`}>
                        {entry.action}
                      </span>
                    </div>
                    <div className="history-card-meta">
                      <span className="history-type">
                        {entry.automated ? '🤖 Auto' : '👤 Manual'}
                      </span>
                      <span className="history-date">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="history-card-body">
                    <div className="history-reason">
                      <strong>Reason:</strong> {entry.reason}
                    </div>

                    {entry.contentType && entry.contentType !== 'other' && (
                      <div className="history-content-type">
                        <strong>Content Type:</strong> {entry.contentType}
                      </div>
                    )}

                    {entry.detectedViolations && entry.detectedViolations.length > 0 && (
                      <div className="history-violations">
                        <strong>Detected Violations:</strong>
                        <div className="violation-tags">
                          {entry.detectedViolations.map((v, i) => (
                            <span key={i} className="violation-tag">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.contentPreview && (
                      <div className="history-content-preview">
                        <strong>Content Preview:</strong>
                        <div className="content-preview-box">
                          {entry.contentPreview}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminModeration;

