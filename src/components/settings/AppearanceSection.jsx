import { useState, useEffect } from 'react';
import { getCursorStyleOptions } from '../../utils/themeManager';

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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const showReducedMotionNotice = prefersReducedMotion && cursorStyle !== 'system' && cursorStyle !== 'reduced-motion';

  return (
    <>
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

      {/* PHASE 2: Quiet Mode + V2 Sub-toggles */}
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
