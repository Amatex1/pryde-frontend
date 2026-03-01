import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';
import api from '../utils/api';
import './SafetyWarning.css';
import {
  getRiskLevel,
  getSafetyRecommendations,
  getStoredCountry
} from '../utils/geolocation';
import { useAuth } from '../context/AuthContext';

/**
 * SafetyWarning — Backend-controlled safety modal
 *
 * Shows when `requiresSafetyCheck` is true (set by backend on login/signup).
 * Acknowledgement is persisted via POST /api/users/safety-acknowledge.
 * No longer uses localStorage for dismissal — backend is source of truth.
 */
function SafetyWarning() {
  const { requiresSafetyCheck, setRequiresSafetyCheck } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (!requiresSafetyCheck) return;

    const countryCode = getStoredCountry();
    if (countryCode) {
      const level = getRiskLevel(countryCode);
      if (level !== 'safe') {
        const recs = getSafetyRecommendations(level);
        setRecommendations(recs);
      }
    }
  }, [requiresSafetyCheck]);

  const handleAcknowledge = useCallback(async () => {
    setAcknowledging(true);
    try {
      await api.post('/users/safety-acknowledge');
      setRequiresSafetyCheck(false);
    } catch (error) {
      logger.error('Failed to acknowledge safety warning:', error);
      // Still dismiss locally so user isn't stuck
      setRequiresSafetyCheck(false);
    } finally {
      setAcknowledging(false);
    }
  }, [setRequiresSafetyCheck]);

  const handleGoToSafety = () => {
    window.location.href = '/safety';
  };

  const handleGoToSettings = () => {
    window.location.href = '/settings';
  };

  if (!requiresSafetyCheck || !recommendations) {
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
            onClick={handleAcknowledge}
            disabled={acknowledging}
          >
            {acknowledging ? 'Saving...' : 'I Understand'}
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

