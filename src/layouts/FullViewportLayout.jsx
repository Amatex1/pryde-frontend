/**
 * FullViewportLayout - Route wrapper for full-viewport pages
 *
 * Unlike AppLayout, this does NOT wrap content in PageContainer
 * so pages can fill the entire viewport without max-width constraints.
 *
 * Use this for:
 * - Messages (messenger-style layout)
 * - Any other full-width app-like experiences
 */

import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import PageErrorBoundary from '../components/PageErrorBoundary';
import MobileNav from '../mobile/MobileNav';
import MobileNavDrawer from './MobileNavDrawer';
import './FullViewportLayout.css';

export default function FullViewportLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleMenuOpen = useCallback(() => {
    setIsMobileNavOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  return (
    <div className="full-viewport-layout">
      <PageErrorBoundary pageName="Full Viewport Layout">
        <Outlet context={{ onMenuOpen: handleMenuOpen }} />
      </PageErrorBoundary>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Mobile navigation drawer */}
      <MobileNavDrawer open={isMobileNavOpen} onClose={handleMenuClose} />
    </div>
  );
}

