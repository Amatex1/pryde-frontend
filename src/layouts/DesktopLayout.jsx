import { Outlet } from 'react-router-dom';
import PageErrorBoundary from '../components/PageErrorBoundary';

/**
 * DesktopLayout - Desktop layout with error boundary protection
 * PHASE 3: Wraps content in error boundary to prevent white screens
 * Used when viewport width > 768px
 */
export default function DesktopLayout() {
  return (
    <PageErrorBoundary pageName="Desktop Layout">
      <Outlet />
    </PageErrorBoundary>
  );
}

