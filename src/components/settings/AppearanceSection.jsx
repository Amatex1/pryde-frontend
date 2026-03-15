import { useState, useEffect } from 'react';
import { getCursorStyleOptions } from '../../utils/themeManager';
import api from '../../utils/api';
import { useToast } from '../../hooks/useToast';
import Toast from '../Toast';

const AppearanceSection = ({
  currentTheme,
  galaxyEnabled,
  quietModeEnabled,
  quietVisuals,
  quietWriting,
  quietMetrics,
  canInstallPWA,
  onThemeToggle,
  onGalaxyToggle,
  onQuietModeToggle,
  onQuietSubToggle,
  onInstallApp,
  cursorStyle,
  onCursorStyleChange,
  textDensity,
  onDensityChange,
}) => {
  const { toasts, showToast, removeToast } = useToast();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // QUIET MODE ENHANCEMENTS: Additional state for all 10 improvements
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [quietContentFilter, setQuietContentFilter] = useState('all');
  const [quietHideViral, setQuietHideViral] = useState(false);
  const [quietGentleTransitions, setQuietGentleTransitions] = useState(true);
  const [quietColorScheme, setQuietColorScheme] = useState('default');
  const [quietHideStories, setQuietHideStories] = useState(false);
  const [quietDeepQuiet, setQuietDeepQuiet] = useState(false);
  const [quietMinimalUI, setQuietMinimalUI] = useState(false);
  const [quietHideTrending, setQuietHideTrending] = useState(false);
  const [quietShowHiddenCount, setQuietShowHiddenCount] = useState(true);
  const [quietHighContrast, setQuietHighContrast] = useState(false);
  const [quietHideMentions, setQuietHideMentions] = useState(false);
  const [quietMuteGroupSummary, setQuietMuteGroupSummary] = useState(false);
  const [showAdvancedQuietOptions, setShowAdvancedQuietOptions] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    api.get('/privacy/settings').then(res => {
      const d = res.data;
      if (d.quietHoursEnabled !== undefined) setQuietHoursEnabled(d.quietHoursEnabled);
      if (d.quietHoursStart !== undefined) setQuietHoursStart(d.quietHoursStart);
      if (d.quietHoursEnd !== undefined) setQuietHoursEnd(d.quietHoursEnd);
      if (d.quietContentFilter !== undefined) setQuietContentFilter(d.quietContentFilter);
      if (d.quietHideViral !== undefined) setQuietHideViral(d.quietHideViral);
      if (d.quietGentleTransitions !== undefined) setQuietGentleTransitions(d.quietGentleTransitions);
      if (d.quietColorScheme !== undefined) setQuietColorScheme(d.quietColorScheme);
      if (d.quietHideStories !== undefined) setQuietHideStories(d.quietHideStories);
      if (d.quietDeepQuiet !== undefined) setQuietDeepQuiet(d.quietDeepQuiet);
      if (d.quietMinimalUI !== undefined) setQuietMinimalUI(d.quietMinimalUI);
      if (d.quietHideTrending !== undefined) setQuietHideTrending(d.quietHideTrending);
      if (d.quietShowHiddenCount !== undefined) setQuietShowHiddenCount(d.quietShowHiddenCount);
      if (d.quietHighContrast !== undefined) setQuietHighContrast(d.quietHighContrast);
      if (d.quietHideMentions !== undefined) setQuietHideMentions(d.quietHideMentions);
      if (d.quietMuteGroupSummary !== undefined) setQuietMuteGroupSummary(d.quietMuteGroupSummary);
    }).catch(() => {});
  }, []);

  const showReducedMotionNotice = prefersReducedMotion && cursorStyle !== 'system' && cursorStyle !== 'reduced-motion';

  // Handler for quiet enhancement changes — updates local state and persists to backend
  const handleQuietEnhancementChange = (setting, value) => {
    switch (setting) {
      case 'quietHoursEnabled': setQuietHoursEnabled(value); break;
      case 'quietHoursStart': setQuietHoursStart(value); break;
      case 'quietHoursEnd': setQuietHoursEnd(value); break;
      case 'quietContentFilter': setQuietContentFilter(value); break;
      case 'quietHideViral': setQuietHideViral(value); break;
      case 'quietGentleTransitions': setQuietGentleTransitions(value); break;
      case 'quietColorScheme': setQuietColorScheme(value); break;
      case 'quietHideStories': setQuietHideStories(value); break;
      case 'quietDeepQuiet': setQuietDeepQuiet(value); break;
      case 'quietMinimalUI': setQuietMinimalUI(value); break;
      case 'quietHideTrending': setQuietHideTrending(value); break;
      case 'quietShowHiddenCount': setQuietShowHiddenCount(value); break;
      case 'quietHighContrast': setQuietHighContrast(value); break;
      case 'quietHideMentions': setQuietHideMentions(value); break;
      case 'quietMuteGroupSummary': setQuietMuteGroupSummary(value); break;
    }
    api.patch('/privacy/settings', { [setting]: value })
      .then(() => showToast('Setting saved', 'success'))
      .catch(() => showToast('Failed to save setting', 'error'));
  };

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      {/* APPEARANCE: Light Mode + Galaxy Mode */}
      <div className="settings-section">
        <h2 className="section-title">🎨 Appearance</h2>
        <p className="section-description">
          Customize your visual experience. Dark + Galaxy is the default Pryde identity.
        </p>

        <div className="notification-settings">
          <div className="notification-item">
            <div className="notification-info">
              <h3>Light Mode</h3>
              <p>For accessibility and bright environments. Dark mode is the default.</p>
            </div>
            <label className="toggle-switch" aria-label="Toggle light mode for accessibility">
              <input
                type="checkbox"
                checked={currentTheme === 'light'}
                onChange={(e) => onThemeToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-item">
            <div className="notification-info">
              <h3>Galaxy Background</h3>
              <p>Immersive galaxy background for a unique visual experience.</p>
            </div>
            <label className="toggle-switch" aria-label="Toggle galaxy background">
              <input
                type="checkbox"
                checked={galaxyEnabled}
                onChange={(e) => onGalaxyToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* PHASE 2: Quiet Mode + V2 Sub-toggles + ENHANCEMENTS */}
      <div className="settings-section">
        <h2 className="section-title">🌿 Quiet Mode</h2>
        <p className="section-description">
          A peaceful browsing experience with softer colors and reduced distractions.
          Perfect for introverts, late-night users, and anyone who prefers a calmer space.
        </p>

        <div className="notification-settings">
          <div className="notification-item">
            <div className="notification-info">
              <h3>Enable Quiet Mode</h3>
              <p>Activate a calm, distraction-free experience across the app.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                id="quiet-mode-toggle"
                name="quietMode"
                checked={quietModeEnabled}
                onChange={onQuietModeToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {quietModeEnabled && (
            <div className="quiet-mode-subtoggle-section">
              <p className="subtoggle-header">Customize your quiet experience:</p>

              {/* IMPROVEMENT 1: Scheduled Quiet Hours */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>🕐 Scheduled Quiet Hours</h3>
                  <p>Automatically enable quiet mode during specific hours</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => handleQuietEnhancementChange('quietHoursEnabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {quietHoursEnabled && (
                <div className="quiet-hours-config" style={{ padding: '12px', margin: '8px 0', background: 'var(--color-surface-muted)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Start</label>
                      <input 
                        type="time" 
                        value={quietHoursStart}
                        onChange={(e) => handleQuietEnhancementChange('quietHoursStart', e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>End</label>
                      <input 
                        type="time" 
                        value={quietHoursEnd}
                        onChange={(e) => handleQuietEnhancementChange('quietHoursEnd', e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* IMPROVEMENT 2: Content Filtering */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>📄 Content Filter</h3>
                  <p>Show only certain types of content</p>
                </div>
                <select 
                  value={quietContentFilter}
                  onChange={(e) => handleQuietEnhancementChange('quietContentFilter', e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="all">Show all</option>
                  <option value="text-only">Text only</option>
                  <option value="images-only">Images only</option>
                  <option value="videos-only">Videos only</option>
                  <option value="no-polls">No polls</option>
                  <option value="low-engagement">Low engagement</option>
                </select>
              </div>

              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>📵 Hide Viral Posts</h3>
                  <p>Filter out high-engagement viral content</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietHideViral}
                    onChange={(e) => handleQuietEnhancementChange('quietHideViral', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* V2 Sub-toggles */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>🎨 Calm Visuals</h3>
                  <p>Reduce motion, soften colors, and minimize visual noise.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="quiet-visuals-toggle"
                    name="quietVisuals"
                    checked={quietVisuals}
                    onChange={(e) => onQuietSubToggle('visuals', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>✍️ Writing Focus</h3>
                  <p>Distraction-free space for journaling and composing posts.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="quiet-writing-toggle"
                    name="quietWriting"
                    checked={quietWriting}
                    onChange={(e) => onQuietSubToggle('writing', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>📊 Hide Metrics</h3>
                  <p>Hide likes, reaction counts, and follower numbers to reduce comparison.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="quiet-metrics-toggle"
                    name="quietMetrics"
                    checked={quietMetrics}
                    onChange={(e) => onQuietSubToggle('metrics', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* IMPROVEMENT 4: Visual Improvements */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>🌊 Gentle Transitions</h3>
                  <p>Smooth, subtle animations instead of abrupt changes</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietGentleTransitions}
                    onChange={(e) => handleQuietEnhancementChange('quietGentleTransitions', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>🎭 Color Scheme</h3>
                  <p>Choose a calming color variant</p>
                </div>
                <select 
                  value={quietColorScheme}
                  onChange={(e) => handleQuietEnhancementChange('quietColorScheme', e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="default">Default</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>

              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>📖 Hide Stories</h3>
                  <p>Hide the Stories section entirely</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietHideStories}
                    onChange={(e) => handleQuietEnhancementChange('quietHideStories', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* IMPROVEMENT 5: Deep Quiet */}
              <div className="notification-item subtoggle" style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: '12px' }}>
                <div className="notification-info">
                  <h3>🌑 Deep Quiet</h3>
                  <p>Maximum calm - hide all metrics and reduce UI</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietDeepQuiet}
                    onChange={(e) => handleQuietEnhancementChange('quietDeepQuiet', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {quietDeepQuiet && (
                <div className="deep-quiet-options" style={{ padding: '12px', margin: '8px 0', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                  <div className="notification-item subtoggle">
                    <div className="notification-info">
                      <h3>🎬 Disable Animations</h3>
                      <p>Remove all animations and autoplay</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={quietMinimalUI}
                        onChange={(e) => handleQuietEnhancementChange('quietMinimalUI', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="notification-item subtoggle">
                    <div className="notification-info">
                      <h3>📈 Hide Trending</h3>
                      <p>Hide trending topics and suggestions</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={quietHideTrending}
                        onChange={(e) => handleQuietEnhancementChange('quietHideTrending', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              )}

              {/* IMPROVEMENT 7: Better Feedback */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>👁️ Show Hidden Count</h3>
                  <p>Display how many posts were filtered</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietShowHiddenCount}
                    onChange={(e) => handleQuietEnhancementChange('quietShowHiddenCount', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* IMPROVEMENT 9: Accessibility */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>♿ High Contrast</h3>
                  <p>Increase contrast for better visibility</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietHighContrast}
                    onChange={(e) => handleQuietEnhancementChange('quietHighContrast', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* IMPROVEMENT 10: Communication */}
              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>@ Hide Mentions</h3>
                  <p>Hide @mention notification counts</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietHideMentions}
                    onChange={(e) => handleQuietEnhancementChange('quietHideMentions', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item subtoggle">
                <div className="notification-info">
                  <h3>👥 Mute Group Summary</h3>
                  <p>Reduce group chat activity notifications</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={quietMuteGroupSummary}
                    onChange={(e) => handleQuietEnhancementChange('quietMuteGroupSummary', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Show more options */}
              <button
                type="button"
                onClick={() => setShowAdvancedQuietOptions(!showAdvancedQuietOptions)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'var(--color-surface-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showAdvancedQuietOptions ? '▲ Less Options' : '▼ More Options'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CURSOR CUSTOMIZATION */}
      <div className="settings-section">
        <h2 className="section-title">🖱️ Cursor Style</h2>
        <p className="section-description">
          Optional cursor styles for people who like small details.
          The default system cursor is always available.
        </p>

        <div className="cursor-style-options">
          {getCursorStyleOptions().map((option) => (
            <label
              key={option.value}
              className={`cursor-style-option ${cursorStyle === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="cursorStyle"
                value={option.value}
                checked={cursorStyle === option.value}
                onChange={() => onCursorStyleChange(option.value)}
              />
              <div className="cursor-option-content">
                <span className="cursor-option-label">{option.label}</span>
                <span className="cursor-option-description">{option.description}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Live preview area - hover here to see the active cursor */}
        <div
          className="cursor-preview-area"
          data-cursor={cursorStyle === 'system' ? undefined : cursorStyle}
          aria-label="Hover here to preview cursor style"
        >
          <span className="cursor-preview-label">
            Move mouse here to preview
          </span>
        </div>

        {/* Reduced motion notice */}
        {showReducedMotionNotice && (
          <p className="cursor-reduced-motion-notice">
            Your OS has <strong>Reduce Motion</strong> enabled, so the system cursor is being used instead.
            To see this style, disable Reduce Motion in your accessibility settings.
          </p>
        )}
      </div>

      {/* TEXT DENSITY */}
      <div className="settings-section">
        <h2 className="section-title">📝 Text Density</h2>
        <p className="section-description">
          Adjust how dense text appears across posts, comments, and messages.
        </p>

        <div className="density-toggle">
          <button
            className={textDensity === 'cozy' ? 'active' : ''}
            onClick={() => onDensityChange('cozy')}
            aria-pressed={textDensity === 'cozy'}
          >
            Cozy
          </button>
          <button
            className={textDensity === 'compact' ? 'active' : ''}
            onClick={() => onDensityChange('compact')}
            aria-pressed={textDensity === 'compact'}
          >
            Compact
          </button>
        </div>
      </div>

      {/* PWA INSTALL */}
      {canInstallPWA && (
        <div className="settings-section">
          <h2 className="section-title">📱 Install App</h2>
          <p className="section-description">
            Install Pryde Social on your device for faster access, offline support, and a native app experience.
          </p>

          <div className="account-actions">
            <div className="action-item">
              <div className="action-info">
                <h3>📲 Install Pryde Social</h3>
                <p>Add Pryde to your home screen for quick access anytime</p>
              </div>
              <button
                type="button"
                onClick={onInstallApp}
                className="btn-install-app"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppearanceSection;

