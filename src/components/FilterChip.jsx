import { X } from 'lucide-react';

/**
 * Reusable Filter Chip - Professional removable tag
 * Matches Pryde design system
 */
const FilterChip = ({ label, onRemove, color = 'var(--color-brand)', bg = 'var(--soft-lavender)' }) => {
  return (
    <div className="filter-chip" style={{ '--chip-bg': bg, '--chip-color': color }}>
      <span className="chip-label">{label}</span>
      <button 
        className="chip-remove" 
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default FilterChip;

