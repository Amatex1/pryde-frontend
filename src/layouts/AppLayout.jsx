/**
 * AppLayout - Unified layout wrapper for all routes
 *
 * REPLACES: MobileLayout and DesktopLayout
 *
 * RESPONSIBILITIES:
 * - Wraps all routed content in PageViewport and PageContainer
 * - Provides consistent structure across all platforms
 * - Error boundary protection
 * - OWNS mobile navigation drawer state (centralized)
 *
 * RULES:
 * - NO viewport detection or matchMedia
 * - NO platform-specific branching
 * - Layout decisions handled by CSS in PageLayout
 */

import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import PageViewport from './PageViewport';
import PageContainer from './PageContainer';
import PageErrorBoundary from '../components/PageErrorBoundary';
import MobileNav from '../mobile/MobileNav';
import MobileNavDrawer from './MobileNavDrawer';
import './AppLayout.css';

export default function AppLayout() {
  // ======================================
  // CENTRALIZED MOBILE NAV STATE
  // Hamburger button and drawer both controlled here
  // ======================================
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleMenuOpen = useCallback(() => {
    setIsMobileNavOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  return (
    <PageViewport>
      <PageErrorBoundary pageName="App Layout">
        <PageContainer>
          {/* Pass menu handlers to child routes via context or outlet context */}
          <Outlet context={{ onMenuOpen: handleMenuOpen }} />
        </PageContainer>
      </PageErrorBoundary>

      {/* Mobile bottom navigation - visibility controlled by CSS */}
      <MobileNav />

      {/* Mobile navigation drawer - controlled by AppLayout state */}
      <MobileNavDrawer open={isMobileNavOpen} onClose={handleMenuClose} />
    </PageViewport>
  );
}

