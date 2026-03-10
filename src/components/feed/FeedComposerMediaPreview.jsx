import { X } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

export default function FeedComposerMediaPreview({ selectedMedia, onRemoveMedia }) {
  if (!selectedMedia?.length) {
    return null;
  }

  return (
    <div className="media-preview">
      {selectedMedia.map((media, index) => (
        <div key={index} className="media-preview-item">
          {media.type === 'video' ? (
            <video src={getImageUrl(media.url)} controls />
          ) : (
            <img src={getImageUrl(media.url)} alt={`Upload ${index + 1}`} />
          )}
          <button
            type="button"
            className="remove-media"
            onClick={() => onRemoveMedia(index)}
            aria-label="Remove media"
            title="Remove"
          >
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}