import { useState } from 'react';
import './MessageSearch.css';

/**
 * MessageSearch - Filter conversations by participant name
 *
 * UPDATED 2025-12-27: Changed from API-based message content search
 * to client-side conversation filtering by participant name.
 * This is faster and more predictable.
 *
 * @param {Function} onSearch - Callback with search query for parent to filter
 * @param {string} placeholder - Optional placeholder text
 */
const MessageSearch = ({ onSearch, placeholder = "Filter conversations..." }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    // Notify parent component to filter conversations
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <div className="message-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="message-search-input"
        />
        {query && (
          <button
            className="clear-search-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;

