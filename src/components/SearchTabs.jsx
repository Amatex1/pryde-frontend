import { useState } from 'react';

/**
 * Reusable Search Tabs 
 * Users | Posts | Groups | Recent
 */
const SearchTabs = ({ 
  activeTab, 
  onTabChange, 
  className = '', 
  showRecent = true 
}) => {
  const tabs = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'posts', label: 'Posts', icon: '💭' },
    { id: 'groups', label: 'Groups', icon: '🏠' },
    ...(showRecent ? [{ id: 'recent', label: 'Recent', icon: '🔥' }] : [])
  ];

  return (
    <div className={`search-tabs ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active glossy' : ''}`}
          onClick={() => onTabChange(tab.id)}

        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SearchTabs;

