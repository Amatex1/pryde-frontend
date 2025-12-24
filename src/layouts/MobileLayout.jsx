import { Outlet, useLocation } from 'react-router-dom';
import MobileHeader from '../mobile/MobileHeader';
import MobileNav from '../mobile/MobileNav';
import './MobileLayout.css';

/**
 * MobileLayout - Clean mobile-first layout wrapper
 * Provides consistent header, content area, and bottom navigation
 * Used when viewport width <= 768px
 */
export default function MobileLayout() {
  const location = useLocation();

  return (
    <div className="mobile-app">
      <MobileHeader />
      
      <main className="mobile-content">
        <Outlet />
      </main>

      <MobileNav currentPath={location.pathname} />
    </div>
  );
}

