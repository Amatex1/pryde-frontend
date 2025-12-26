import { Outlet, useLocation } from 'react-router-dom';
import MobileHeader from '../mobile/MobileHeader';
import MobileNav from '../mobile/MobileNav';
import PageErrorBoundary from '../components/PageErrorBoundary';
import './MobileLayout.css';

/**
 * MobileLayout - Clean mobile-first layout wrapper with error boundary
 * PHASE 3: Wraps content in error boundary to prevent white screens
 * Provides consistent header, content area, and bottom navigation
 * Used when viewport width <= 768px
 */
export default function MobileLayout() {
  const location = useLocation();

  return (
    <div className="mobile-app">
      <MobileHeader />

      <main className="mobile-content">
        <PageErrorBoundary pageName="Mobile Content">
          <Outlet />
        </PageErrorBoundary>
      </main>

      <MobileNav currentPath={location.pathname} />
    </div>
  );
}

