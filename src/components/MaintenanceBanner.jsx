/**
 * Maintenance Banner Component
 * 
 * 🔧 Banner shown to admins when site is in maintenance mode
 * 
 * Features:
 * - Shows maintenance message and ETA
 * - Allows admin to disable maintenance mode
 * - Non-intrusive but prominent warning
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import './MaintenanceBanner.css';

export default function MaintenanceBanner() {
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('maintenanceBannerDismissed') === 'true'
  );

  useEffect(() => {
    // Check sessionStorage for maintenance warning set by App.jsx
    const stored = sessionStorage.getItem('maintenance_warning');
    if (stored) {
      try {
        setMaintenanceInfo(JSON.parse(stored));
      } catch (e) {
        console.error('[MaintenanceBanner] Failed to parse maintenance info:', e);
      }
    }
  }, []);

  if (!maintenanceInfo || dismissed) return null;

  const handleDisableMaintenance = async () => {
    setLoading(true);
    try {
      await api.post('/admin/debug/maintenance/disable');
      sessionStorage.removeItem('maintenance_warning');
      setMaintenanceInfo(null);
      // Optionally reload to reflect the change
      window.location.reload();
    } catch (error) {
      console.error('[MaintenanceBanner] Failed to disable maintenance:', error);
      alert('Failed to disable maintenance mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('maintenanceBannerDismissed', 'true');
  };

  return (
    <div className="maintenance-banner">
      <div className="maintenance-banner-content">
        <span className="maintenance-icon">🔧</span>
        <div className="maintenance-text">
          <strong>Maintenance Mode Active</strong>
          <span className="maintenance-message">
            {maintenanceInfo.message}
          </span>
          {maintenanceInfo.eta && (
            <span className="maintenance-eta">
              ETA: {maintenanceInfo.eta}
            </span>
          )}
        </div>
        <div className="maintenance-actions">
          <button 
            className="maintenance-btn-disable"
            onClick={handleDisableMaintenance}
            disabled={loading}
          >
            {loading ? 'Disabling...' : 'Disable Maintenance'}
          </button>
          <button 
            className="maintenance-btn-dismiss"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
