import { ShieldCheck, Shield, Sparkles, AlertTriangle, Ban } from 'lucide-react';
import { TRUST_LEVEL_LABELS, TRUST_LEVEL_COLORS } from '../constants/trustLevels';
import './TrustBadge.css';

/**
 * TrustBadge - Displays user's trust level
 * 
 * @param {string} trustLevel - trust level: trusted, regular, new, caution, restricted
 * @param {boolean} showLabel - Whether to show the label text
 * @param {string} size - Size: small, medium, large
 */
function TrustBadge({ trustLevel, showLabel = true, size = 'medium' }) {
  const color = TRUST_LEVEL_COLORS[trustLevel] || '#6B7280';
  const label = TRUST_LEVEL_LABELS[trustLevel] || 'Member';

  const getIcon = () => {
    const iconProps = { 
      size: size === 'small' ? 12 : size === 'large' ? 20 : 16,
      strokeWidth: 2
    };

    switch (trustLevel) {
      case 'trusted':
        return <ShieldCheck {...iconProps} />;
      case 'regular':
        return <Shield {...iconProps} />;
      case 'new':
        return <Sparkles {...iconProps} />;
      case 'caution':
        return <AlertTriangle {...iconProps} />;
      case 'restricted':
        return <Ban {...iconProps} />;
      default:
        return <Shield {...iconProps} />;
    }
  };

  return (
    <span 
      className={`trust-badge trust-badge-${size}`}
      style={{ 
        '--trust-color': color,
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`
      }}
      title={label}
    >
      {getIcon()}
      {showLabel && <span className="trust-badge-label">{label}</span>}
    </span>
  );
}

export default TrustBadge;
