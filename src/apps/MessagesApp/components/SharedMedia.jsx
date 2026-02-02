/**
 * SharedMedia — Collapsible shared media section for InfoPanel
 * Shows photos/attachments shared between users
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import logger from '../../../utils/logger';
import { getImageUrl } from '../../../utils/imageUrl';

export default function SharedMedia({ userId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);

  const fetchMedia = useCallback(async (skip = 0) => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await api.get(`/messages/${userId}/media?limit=9&skip=${skip}`);
      setMedia(prev => skip === 0 ? res.data.media : [...prev, ...res.data.media]);
      setHasMore(res.data.hasMore);
    } catch (error) {
      logger.error('Error fetching shared media:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on expand (lazy load)
  useEffect(() => {
    if (isExpanded && !initialLoad) {
      fetchMedia();
      setInitialLoad(true);
    }
  }, [isExpanded, initialLoad, fetchMedia]);

  // Reset when userId changes
  useEffect(() => {
    setMedia([]);
    setHasMore(false);
    setInitialLoad(false);
    if (isExpanded) {
      fetchMedia();
      setInitialLoad(true);
    }
  }, [userId]);

  const handleLoadMore = () => {
    fetchMedia(media.length);
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Filter to only image attachments
  const imageMedia = media.filter(item => 
    item.attachment && (
      item.attachment.includes('.jpg') ||
      item.attachment.includes('.jpeg') ||
      item.attachment.includes('.png') ||
      item.attachment.includes('.gif') ||
      item.attachment.includes('.webp') ||
      item.attachment.startsWith('data:image')
    )
  );

  return (
    <div className="shared-media">
      <div 
        className="shared-media__header" 
        onClick={handleToggle}
        data-expanded={isExpanded}
      >
        <span className="shared-media__title">
          📸 Shared Media
        </span>
        <span className="shared-media__toggle">▼</span>
      </div>
      
      {isExpanded && (
        <>
          {loading && media.length === 0 ? (
            <div className="shared-media__empty">Loading...</div>
          ) : imageMedia.length === 0 ? (
            <div className="shared-media__empty">No shared media yet</div>
          ) : (
            <>
              <div className="shared-media__grid">
                {imageMedia.map(item => (
                  <a
                    key={item._id}
                    href={getImageUrl(item.attachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shared-media__item"
                  >
                    <img src={getImageUrl(item.attachment)} alt="" loading="lazy" />
                  </a>
                ))}
              </div>
              {hasMore && (
                <button
                  className="shared-media__load-more"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

