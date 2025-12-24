import { useNavigate } from 'react-router-dom';

/**
 * MobileHeader - Minimal mobile header
 * Simple branding with tap-to-home functionality
 */
export default function MobileHeader() {
  const navigate = useNavigate();

  return (
    <header className="mobile-header">
      <div 
        className="mobile-header-title" 
        onClick={() => navigate('/feed')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/feed');
          }
        }}
        aria-label="Go to feed"
      >
        Pryde
      </div>
    </header>
  );
}

