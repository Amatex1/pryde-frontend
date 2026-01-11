/**
 * Pryde Emoji Set - Curated reactions for the Pryde community
 *
 * IMPORTANT: This list MUST match the backend APPROVED_REACTIONS in server/models/Reaction.js
 * Backend source of truth: '👍', '❤️', '😂', '😮', '🥺', '😡', '🤗', '🎉', '🔥', '👏', '🏳️‍🌈', '🏳️‍⚧️'
 */

export const PRYDE_REACTIONS = [
  { id: 'like', emoji: '👍', label: 'Like' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'laugh', emoji: '😂', label: 'Laugh' },
  { id: 'shocked', emoji: '😮', label: 'Shocked' },
  { id: 'sad', emoji: '🥺', label: 'Sad' },  // Backend uses 🥺 (pleading face), not 😢
  { id: 'angry', emoji: '😡', label: 'Angry' },
  { id: 'hug', emoji: '🤗', label: 'Hug' },
  { id: 'party', emoji: '🎉', label: 'Party' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'clap', emoji: '👏', label: 'Clap' },
  { id: 'pride', emoji: '🏳️‍🌈', label: 'Pride' },
  { id: 'trans', emoji: '🏳️‍⚧️', label: 'Trans' }
];

// Get just the emoji strings for quick access
export const PRYDE_EMOJI_LIST = PRYDE_REACTIONS.map(r => r.emoji);

// Get emoji by ID
export const getEmojiById = (id) => {
  const reaction = PRYDE_REACTIONS.find(r => r.id === id);
  return reaction ? reaction.emoji : null;
};

// Get label by emoji
export const getLabelByEmoji = (emoji) => {
  const reaction = PRYDE_REACTIONS.find(r => r.emoji === emoji);
  return reaction ? reaction.label : null;
};

