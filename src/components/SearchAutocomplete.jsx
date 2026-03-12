/**
 * Search Autocomplete Dropdown - SOTA suggestions as you type
 * Categories: Users, Posts, Groups
 * Keyboard nav, click to select
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { User, MessageCircle, Users, ArrowRight } from 'lucide-react';

const SearchAutocomplete = ({ 
  suggestions = [], 
  visible = false, 
  onSelect, 
  loading = false,
  query 
}) => {
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);

  const categories = {
    user: User,
    post: MessageCircle,
    group: Users
  };

  const handleKeyDown = useCallback((e) => {
    if (!visible) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[highlighted]) {
          onSelect(suggestions[highlighted]);
        }
        break;
      case 'Escape':
        onSelect(null);
        break;
    }
  }, [visible, suggestions, highlighted, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (visible && containerRef.current) {
      containerRef.current.scrollTop = highlighted * 56; // Item height
    }
  }, [highlighted, visible]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="search-autocomplete" ref={containerRef}>
      {loading ? (
        <div className="autocomplete-loading">
          <div className="shimmer-line" />
          <div className="shimmer-line short" />
        </div>
      ) : (
        suggestions.map((suggestion, index) => {
          const Icon = categories[suggestion.type] || Users;
          return (
            <button
              key={suggestion.id || suggestion.title}
              className={`autocomplete-item ${index === highlighted ? 'highlighted' : ''}`}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => setHighlighted(index)}
            >
              <Icon size={18} className="autocomplete-icon" />
              <div className="autocomplete-content">
                <div className="autocomplete-title">{suggestion.title}</div>
                {suggestion.desc && <div className="autocomplete-desc">{suggestion.desc}</div>}
              </div>
              <ArrowRight size={16} className="autocomplete-arrow" />
            </button>
          );
        })
      )}
    </div>
  );
};

export default SearchAutocomplete;

