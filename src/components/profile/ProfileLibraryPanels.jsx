import { Calendar, ChevronRight, Lock, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../EmptyState';
import OptimizedImage from '../OptimizedImage';

const panelCardStyle = { marginBottom: '20px', padding: '20px', borderRadius: '12px' };
const metaRowStyle = { display: 'flex', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' };
const titleMap = { journals: 'Journals', longform: 'Stories', photoEssays: 'Photo Essays' };

function ProfileLibraryPanels({ activeTab, journals, longformPosts, photoEssays, searchResults, getImageUrl }) {
  if (activeTab === 'posts') return null;

  const visibleJournals = searchResults?.journals ?? journals;
  const visibleLongforms = searchResults?.longforms ?? longformPosts;

  return (
    <>
      <h2 className="section-title" style={{ marginBottom: '20px' }}>{titleMap[activeTab]}</h2>

      {activeTab === 'journals' && (
        <div className="journals-list">
          {visibleJournals.length === 0 ? (
            <EmptyState type="journals" className="glossy" title={searchResults ? 'No journals found' : 'No journal entries yet'} description={searchResults ? 'Try a different search.' : undefined} />
          ) : visibleJournals.map((journal) => (
            <div key={journal._id} className="journal-card glossy fade-in" style={panelCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--pryde-purple)' }}>{journal.title || 'Untitled Entry'}</h3>
                  <div style={metaRowStyle}>
                    <span><Calendar size={14} strokeWidth={1.75} aria-hidden="true" /> {new Date(journal.createdAt).toLocaleDateString()}</span>
                    {journal.mood && <span><Smile size={14} strokeWidth={1.75} aria-hidden="true" /> {journal.mood}</span>}
                    <span><Lock size={14} strokeWidth={1.75} aria-hidden="true" /> {journal.visibility}</span>
                  </div>
                </div>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{journal.content}</p>
              {journal.tags?.length > 0 && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {journal.tags.map((tag, idx) => (
                    <span key={idx} style={{ padding: '4px 12px', background: 'var(--soft-lavender)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--pryde-purple)' }}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'longform' && (
        <div className="longform-list">
          {visibleLongforms.length === 0 ? (
            <EmptyState type="stories" className="glossy" title={searchResults ? 'No stories found' : 'No stories yet'} description={searchResults ? 'Try a different search.' : undefined} />
          ) : visibleLongforms.map((longform) => (
            <div key={longform._id} className="longform-card glossy fade-in" style={panelCardStyle}>
              {longform.coverImage && <img src={getImageUrl(longform.coverImage)} alt={longform.title} style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />}
              <h2 style={{ margin: '0 0 10px 0', color: 'var(--pryde-purple)' }}>{longform.title}</h2>
              <div style={{ ...metaRowStyle, marginBottom: '15px' }}>
                <span><Calendar size={14} strokeWidth={1.75} aria-hidden="true" /> {new Date(longform.createdAt).toLocaleDateString()}</span>
                {longform.readTime && <span>⏱️ {longform.readTime} min read</span>}
                <span><Lock size={14} strokeWidth={1.75} aria-hidden="true" /> {longform.visibility}</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{longform.body.substring(0, 300)}...</p>
              <Link to={`/longform/${longform._id}`} style={{ color: 'var(--pryde-purple)', fontWeight: 'bold', textDecoration: 'none' }}>
                Read more <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'photoEssays' && (
        <div className="photo-essays-list">
          {photoEssays.length === 0 ? (
            <EmptyState type="media" className="glossy" title="No photo essays yet" description="Photo essays will show up here when they are published." />
          ) : photoEssays.map((essay) => (
            <div key={essay._id} className="photo-essay-card glossy fade-in" style={panelCardStyle}>
              <h3 style={{ margin: '0 0 15px 0', color: 'var(--pryde-purple)' }}>{essay.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                {essay.photos?.slice(0, 4).map((photo, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <OptimizedImage src={getImageUrl(photo.url)} alt={photo.caption || `Photo ${idx + 1}`} style={{ width: '100%', borderRadius: '8px', aspectRatio: '1', objectFit: 'cover' }} />
                    {photo.caption && <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{photo.caption}</p>}
                  </div>
                ))}
              </div>
              {essay.photos?.length > 4 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>+{essay.photos.length - 4} more photos</p>}
              <div style={{ ...metaRowStyle, marginTop: '10px' }}>
                <span><Calendar size={14} strokeWidth={1.75} aria-hidden="true" /> {new Date(essay.createdAt).toLocaleDateString()}</span>
                <span><Lock size={14} strokeWidth={1.75} aria-hidden="true" /> {essay.visibility}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default ProfileLibraryPanels;