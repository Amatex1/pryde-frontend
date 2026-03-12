import { useState } from 'react';
import { Users, MessageCircle, Hash, Filter, Clock, CheckCircle, Image } from 'lucide-react';
import FilterChip from './FilterChip';

/**
 * Advanced Search Filters - Drawer/Sidebar
 * Tabs + advanced options matching SOTA apps (Twitter, LinkedIn)
 */
const SearchFilters = ({ filters, onChange, className = '' }) => {
  const [openAdvanced, setOpenAdvanced] = useState(false);

  const tabs = [
    { id: 'all', label: 'All', icon: <Hash size={18} /> },
    { id: 'users', label: 'People', icon: <Users size={18} /> },
    { id: 'posts', label: 'Posts', icon: <MessageCircle size={18} /> },
    { id: 'groups', label: 'Groups', icon: <Hash size={18} /> },
  ];

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({
      tab: 'all',
      sort: 'relevance',
      verified: false,
      media: false,
      dateFrom: '',
      dateTo: ''
    });
  };

  const activeFilters = [];
  if (filters.tab !== 'all') activeFilters.push({ label: `Tab: ${filters.tab}`, key: 'tab' });
  if (filters.sort !== 'relevance') activeFilters.push({ label: `Sort: ${filters.sort}`, key: 'sort' });
  if (filters.verified) activeFilters.push({ label: 'Verified', key: 'verified' });
  if (filters.media) activeFilters.push({ label: 'Media', key: 'media' });

  return (
    <div className={`search-filters ${className}`}>
      {/* Filter Tabs */}
      <div className="filter-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`filter-tab ${filters.tab === tab.id ? 'active glossy' : ''}`}
            onClick={() => updateFilter('tab', tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <div className="active-filters">
          <div className="filters-header">
            <Filter size={16} />
            <span>Active filters ({activeFilters.length})</span>
          </div>
          <div className="chips-container">
            {activeFilters.map(filter => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                onRemove={() => {
                  const newFilters = { ...filters };
                  delete newFilters[filter.key];
                  if (filter.key === 'tab') newFilters.tab = 'all';
                  if (filter.key === 'sort') newFilters.sort = 'relevance';
                  onChange(newFilters);
                }}
              />
            ))}
            <button className="clear-all-btn" onClick={clearAll}>Clear all</button>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="advanced-filters">
        <button 
          className="toggle-advanced" 
          onClick={() => setOpenAdvanced(!openAdvanced)}
        >
          <Filter size={18} />
          <span>Advanced {openAdvanced ? '▲' : '▼'}</span>
        </button>
        
        {openAdvanced && (
          <div className="advanced-options">
            <div className="filter-group">
              <label className="filter-label">
                <CheckCircle size={16} />
                Verified accounts only
                <input
                  type="checkbox"
                  checked={filters.verified || false}
                  onChange={(e) => updateFilter('verified', e.target.checked)}
                />
              </label>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <Image size={16} />
                Posts with media
                <input
                  type="checkbox"
                  checked={filters.media || false}
                  onChange={(e) => updateFilter('media', e.target.checked)}
                />
              </label>
            </div>

            <div className="filter-group">
              <label className="filter-row-label">
                <Clock size={16} />
                Sort by
                <select 
                  value={filters.sort || 'relevance'}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Most recent</option>
                  <option value="engagement">Engagement</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;

