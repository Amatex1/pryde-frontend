const FILTER_OPTIONS = [
  { value: 'followers', icon: '👥', label: 'Following' },
  { value: 'public', icon: '🌍', label: 'Everyone' },
];

export default function FeedFilterTabs({ activeFilter, onChange }) {
  return (
    <div className="feed-tabs glossy" role="tablist" aria-label="Feed filters">
      {FILTER_OPTIONS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          role="tab"
          aria-selected={activeFilter === filter.value}
          className={`feed-tab ${activeFilter === filter.value ? 'active' : ''}`}
          onClick={() => onChange(filter.value)}
        >
          <span className="tab-icon">{filter.icon}</span>
          <span className="tab-label">{filter.label}</span>
        </button>
      ))}
    </div>
  );
}