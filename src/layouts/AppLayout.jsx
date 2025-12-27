/**
 * AppLayout - Unified layout wrapper for all routes
 * 
 * REPLACES: MobileLayout and DesktopLayout
 * 
 * RESPONSIBILITIES:
 * - Wraps all routed content in PageViewport and PageContainer
 * - Provides consistent structure across all platforms
 * - Error boundary protection
 * 
 * RULES:
 * - NO viewport detection or matchMedia
 * - NO platform-specific branching
 * - Layout decisions handled by CSS in PageLayout
 */

import { Outlet } from 'react-router-dom';
import PageViewport from './PageViewport';
import PageContainer from './PageContainer';
import PageErrorBoundary from '../components/PageErrorBoundary';
import MobileNav from '../mobile/MobileNav';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <PageViewport>
      <PageErrorBoundary pageName="App Layout">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </PageErrorBoundary>
      
      {/* Mobile bottom navigation - visibility controlled by CSS */}
      <MobileNav />
    </PageViewport>
  );
}

