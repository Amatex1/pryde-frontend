import { useState, useEffect } from 'react';
import logger from '../utils/logger';
import './SafetyWarning.css';
import {
  getRiskLevel,
  getSafetyRecommendations,
  getStoredCountry
} from '../utils/geolocation';

// NOTE: detectUserCountry removed - country is now provided by backend during login
// This avoids CORS issues with external geolocation APIs (ipapi.co, ip-api.com, etc.)

function SafetyWarning() {
  const [show, setShow] = useState(false);
  const [riskLevel, setRiskLevel] = useState('safe');
  const [recommendations, setRecommendations] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    try {
      // Check if user has already dismissed the warning
      const dismissedWarning = localStorage.getItem('pryde_safety_warning_dismissed');
      if (dismissedWarning) {
        setDismissed(true);
        return;
      }

      // Get stored country (set by backend during login)
      // NOTE: No longer calling external APIs - backend provides countryCode during login
      const countryCode = getStoredCountry();

      if (countryCode) {
        const level = getRiskLevel(countryCode);
        setRiskLevel(level);

        if (level !== 'safe') {
          const recs = getSafetyRecommendations(level);
          setRecommendations(recs);
          setShow(true);
        }
      }
      // If no countryCode stored, user either hasn't logged in yet or backend didn't provide it
      // This is fine - we just won't show a warning
    } catch (error) {
      logger.error('Failed to check location:', error);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pryde_safety_warning_dismissed', 'true');
  };

  const handleGoToSafety = () => {
    window.location.href = '/safety';
  };

  const handleGoToSettings = () => {
    window.location.href = '/settings';
  };

  if (!show || !recommendations || dismissed) {
    return null;
  }

  return (
    <div className="safety-warning-overlay">
      <div className="safety-warning-modal" style={{ borderColor: recommendations.color }}>
        <div className="safety-warning-header" style={{ background: recommendations.color }}>
          <h2>{recommendations.title}</h2>
        </div>

        <div className="safety-warning-content">
          <p className="safety-warning-message">{recommendations.message}</p>

          <div className="safety-recommendations">
            <h3>Safety Recommendations:</h3>
            <ul>
              {recommendations.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="safety-warning-notice">
            <p>
              <strong>Your safety is our priority.</strong> If you feel unsafe using this platform, 
              please consider deactivating your account or using additional privacy measures.
            </p>
          </div>
        </div>

        <div className="safety-warning-actions">
          <button 
            className="btn-safety-center"
            onClick={handleGoToSafety}
          >
            📖 Read Full Safety Guide
          </button>
          <button 
            className="btn-privacy-settings"
            onClick={handleGoToSettings}
          >
            🔒 Privacy Settings
          </button>
          <button 
            className="btn-dismiss-warning"
            onClick={handleDismiss}
          >
            I Understand
          </button>
        </div>

        <div className="safety-warning-footer">
          <small>
            This warning is based on your detected location. You can dismiss it, but we strongly 
            recommend following these safety guidelines.
          </small>
        </div>
      </div>
    </div>
  );
}

export default SafetyWarning;

