import { FileText, Image } from 'lucide-react';

const tabContainerStyle = {
  marginBottom: '20px',
  padding: '10px',
  borderRadius: '12px',
  display: 'flex',
  gap: '10px',
  overflowX: 'auto',
};

const tabButtonStyle = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const TABS = [
  { id: 'posts', label: <><FileText size={20} strokeWidth={1.75} aria-hidden="true" /> Posts</> },
  { id: 'journals', label: <>📔 Journals</> },
  { id: 'longform', label: <>📖 Stories</> },
  { id: 'photoEssays', label: <><Image size={16} strokeWidth={1.75} aria-hidden="true" /> Photo Essays</> },
];

function ProfileTabs({ activeTab, onTabChange }) {
  return (
    <div className="profile-tabs glossy" style={tabContainerStyle}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...tabButtonStyle,
              background: isActive ? 'var(--pryde-purple)' : 'var(--background-light)',
              color: isActive ? 'white' : 'var(--text-main)',
              fontWeight: isActive ? 'bold' : 'normal',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default ProfileTabs;