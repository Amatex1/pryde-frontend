import { Outlet } from 'react-router-dom';

/**
 * DesktopLayout - Preserves existing desktop layout
 * Simply passes through to child routes without modification
 * Used when viewport width > 768px
 */
export default function DesktopLayout() {
  return <Outlet />;
}

