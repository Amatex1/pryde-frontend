import React, { useState, useRef, useEffect, useCallback } from 'react';
import './GifPicker.css';

const GifPicker = ({ onGifSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const pickerRef = useRef(null);

  // Giphy API key - get your own at https://developers.giphy.com/
  const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';

  const categories = [
    { id: 'trending', label: '🔥 Trending', search: '' },
    { id: 'happy', label: '😊 Happy', search: 'happy' },
    { id: 'love', label: '❤️ Love', search: 'love' },
    { id: 'laugh', label: '😂 Laugh', search: 'laugh' },
    { id: 'sad', label: '😢 Sad', search: 'sad' },
    { id: 'excited', label: '🎉 Excited', search: 'excited' },
    { id: 'dance', label: '💃 Dance', search: 'dance' },
    { id: 'pride', label: '🏳️‍🌈 Pride', search: 'pride lgbtq' },
  ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const fetchTrendingGifs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=pg-13`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, [GIPHY_API_KEY]);

  const searchGifs = useCallback(async (query) => {
    if (!query.trim()) {
      fetchTrendingGifs();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=pg-13`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, [GIPHY_API_KEY, fetchTrendingGifs]);

  // Load trending GIFs on mount
  useEffect(() => {
    fetchTrendingGifs();
  }, [fetchTrendingGifs]);

  // PERFORMANCE: Debounce GIF search to reduce API calls
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        searchGifs(searchQuery);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, searchGifs]);

  const handleSearch = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent form
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    setSearchQuery(category.search);
    if (category.search) {
      searchGifs(category.search);
    } else {
      fetchTrendingGifs();
    }
  };

  const handleGifClick = (gif) => {
    // Use the fixed_height or original GIF URL from Giphy
    const gifUrl = gif.images?.fixed_height?.url || gif.images?.original?.url;
    if (gifUrl) {
      onGifSelect(gifUrl);
      onClose();
    }
  };

  return (
    <div className="gif-picker-overlay">
      <div className="gif-picker" ref={pickerRef}>
        <div className="gif-picker-header">
          <h4>Choose a GIF</h4>
          <button type="button" className="gif-picker-close" onClick={onClose}>✕</button>
        </div>

        {/* Separate form to prevent bubbling to parent post form */}
        <form
          onSubmit={handleSearch}
          className="gif-search-form"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Search GIFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gif-search-input"
          />
          <button
            type="submit"
            className="gif-search-btn"
            onClick={(e) => e.stopPropagation()}
          >
            🔍
          </button>
        </form>

        <div className="gif-categories">
          {categories.map(category => (
            <button
              type="button"
              key={category.id}
              className={`gif-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="gif-grid">
          {loading ? (
            <div className="gif-loading">Loading GIFs...</div>
          ) : gifs.length > 0 ? (
            gifs.map((gif) => {
              // Giphy uses images object with different sizes
              const previewUrl = gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url;

              return (
                <div
                  key={gif.id}
                  className="gif-item"
                  onClick={() => handleGifClick(gif)}
                >
                  <img
                    src={previewUrl}
                    alt={gif.title || 'GIF'}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="gif-no-results">No GIFs found</div>
          )}
        </div>

        <div className="gif-picker-footer">
          <img
            src="https://giphy.com/static/img/giphy_logo_square_social.png"
            alt="Powered by GIPHY"
            className="giphy-attribution"
          />
        </div>
      </div>
    </div>
  );
};

export default GifPicker;

