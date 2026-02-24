import { useState, useEffect } from 'react';
import './CookieBanner.css';

export const CONSENT_KEY = 'pryde_cookie_consent';

export function getCookieConsent() {
  return localStorage.getItem(CONSENT_KEY); // 'all' | 'essential' | null
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === 'all';
}

function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(CONSENT_KEY, 'all');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(CONSENT_KEY, 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-banner-content">
        <div className="cookie-banner-text">
          <p className="cookie-banner-title">We use cookies</p>
          <p className="cookie-banner-body">
            Essential cookies keep the app working (auth, security). We also use anonymous performance
            analytics to improve load times. No tracking, no ads, no third-party profiling.{' '}
            <a href="/cookie-policy" className="cookie-policy-link">Cookie policy</a>
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button
            onClick={handleEssentialOnly}
            className="cookie-essential-btn"
            aria-label="Accept essential cookies only"
          >
            Essential only
          </button>
          <button
            onClick={handleAcceptAll}
            className="cookie-accept-btn"
            aria-label="Accept all cookies including analytics"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
