import React from 'react';
import { useMediaQuery } from 'react-responsive';
import './PageHeader.css';

/**
 * PageHeader - Reusable page header that hides on mobile
 * On mobile, the global navbar already provides context via MobileHeader
 * This prevents duplicate page banners
 */
function PageHeader({ title, subtitle, children }) {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // On mobile, the global navbar already provides context
  if (isMobile) return null;

  return (
    <div className="page-header-component">
      <h1 className="page-header-title">{title}</h1>
      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export default PageHeader;

