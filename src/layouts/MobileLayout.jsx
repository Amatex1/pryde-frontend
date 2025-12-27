import { Outlet, useLocation } from 'react-router-dom';
import MobileNav from '../mobile/MobileNav';
import PageErrorBoundary from '../components/PageErrorBoundary';
import './MobileLayout.css';

/**
 * MobileLayout - Clean mobile-first layout wrapper with error boundary
 * One Header Rule: Global navbar is authoritative, no duplicate headers
 * Provides content area and bottom navigation
 * Used when viewport width <= 768px
 */
export default function MobileLayout() {
  const location = useLocation();

  return (
    <div className="mobile-app">
      {/* MobileHeader removed — global navbar is authoritative (One Header Rule) */}

      <main className="mobile-content">
        <PageErrorBoundary pageName="Mobile Content">
          <Outlet />
        </PageErrorBoundary>
      </main>

      <MobileNav currentPath={location.pathname} />
    </div>
  );
}

