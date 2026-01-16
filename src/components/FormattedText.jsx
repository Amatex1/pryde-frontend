import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertEmojiShortcuts } from '../utils/textFormatting';
import { sanitizeContent } from '../utils/sanitize';
import './FormattedText.css';

// Regex to match special tokens (hashtags, mentions, URLs) while preserving surrounding text
const SPECIAL_TOKEN_REGEX = /(#[\w]+|@[\w]+|https?:\/\/[^\s]+)/g;

const FormattedText = memo(function FormattedText({ text, className = '' }) {
  const navigate = useNavigate();

  if (!text) return null;

  // SECURITY: Sanitize content to prevent XSS attacks
  const sanitizedText = sanitizeContent(text);

  // Convert emoji shortcuts
  const textWithEmojis = convertEmojiShortcuts(sanitizedText);

  const handleMentionClick = (username) => {
    navigate(`/profile/${username}`);
  };

  // Split by special tokens, keeping the delimiters
  const parts = textWithEmojis.split(SPECIAL_TOKEN_REGEX);

  // Build output with minimal DOM nodes
  const elements = [];
  let plainTextBuffer = '';

  parts.forEach((part, index) => {
    if (!part) return;

    // Check for hashtags
    if (part.match(/^#[\w]+$/)) {
      // Flush plain text buffer first
      if (plainTextBuffer) {
        elements.push(plainTextBuffer);
        plainTextBuffer = '';
      }
      const tag = part.substring(1);
      elements.push(
        <a
          key={`h-${index}`}
          href={`/hashtag/${tag}`}
          className="hashtag-link"
          onClick={(e) => {
            e.preventDefault();
            navigate(`/hashtag/${tag}`);
          }}
        >
          {part}
        </a>
      );
      return;
    }

    // Check for mentions
    if (part.match(/^@[\w]+$/)) {
      if (plainTextBuffer) {
        elements.push(plainTextBuffer);
        plainTextBuffer = '';
      }
      const username = part.substring(1);
      elements.push(
        <span
          key={`m-${index}`}
          className="mention-link"
          onClick={() => handleMentionClick(username)}
        >
          {part}
        </span>
      );
      return;
    }

    // Check for URLs
    if (part.match(/^https?:\/\//)) {
      if (plainTextBuffer) {
        elements.push(plainTextBuffer);
        plainTextBuffer = '';
      }
      elements.push(
        <a
          key={`u-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="url-link"
        >
          {part}
        </a>
      );
      return;
    }

    // Regular text - accumulate into buffer (no span wrapper)
    plainTextBuffer += part;
  });

  // Flush any remaining plain text
  if (plainTextBuffer) {
    elements.push(plainTextBuffer);
  }

  return <span className={className}>{elements}</span>;
});

export default FormattedText;

