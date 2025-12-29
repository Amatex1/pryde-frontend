import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import './Poll.css';

const Poll = ({ poll, postId, currentUserId, onVote }) => {
  const [voting, setVoting] = useState(false);
  const [removingVote, setRemovingVote] = useState(false);
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [voterData, setVoterData] = useState(null);
  const [loadingVoters, setLoadingVoters] = useState(false);

  if (!poll || !poll.question) return null;

  const hasEnded = poll.endsAt && new Date(poll.endsAt) < new Date();
  const resultsHidden = poll._resultsHidden; // Backend flag when resultsVisibility is 'author'
  const totalVotes = resultsHidden ? null : poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

  // Check if current user has voted
  const userVotedIndex = poll.options.findIndex(opt =>
    opt.votes?.some(vote => vote === currentUserId || vote._id === currentUserId)
  );
  const hasVoted = userVotedIndex !== -1;

  // Always show results (unless resultsHidden by author)
  // Users can see vote counts even before voting
  const canSeeResults = !resultsHidden;

  const handleVote = async (optionIndex) => {
    if (voting || removingVote || hasEnded) return;

    setVoting(true);
    try {
      const response = await api.post(`/posts/${postId}/poll/vote`, { optionIndex });

      if (onVote) {
        onVote(response.data);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.response?.data?.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (voting || removingVote || hasEnded || !hasVoted) return;

    setRemovingVote(true);
    try {
      const response = await api.delete(`/posts/${postId}/poll/vote`);

      if (onVote) {
        onVote(response.data);
      }
    } catch (error) {
      console.error('Error removing vote:', error);
      alert(error.response?.data?.message || 'Failed to remove vote');
    } finally {
      setRemovingVote(false);
    }
  };

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatTimeRemaining = () => {
    if (!poll.endsAt) return null;

    const now = new Date();
    const end = new Date(poll.endsAt);
    const diff = end - now;

    if (diff <= 0) return 'Poll ended';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleShowVoters = async () => {
    if (resultsHidden || totalVotes === 0) return;

    setLoadingVoters(true);
    try {
      const response = await api.get(`/posts/${postId}/poll/voters`);
      setVoterData(response.data);
      setShowVoterModal(true);
    } catch (error) {
      console.error('Error fetching voters:', error);
      alert(error.response?.data?.message || 'Failed to load voters');
    } finally {
      setLoadingVoters(false);
    }
  };

  return (
    <div className="poll-container">
      <div className="poll-question">
        <span className="poll-icon">📊</span>
        <h4>{poll.question}</h4>
      </div>

      <div className="poll-options">
        {poll.options.map((option, index) => {
          const votes = option.votes?.length || 0;
          const percentage = getPercentage(votes);
          const isSelected = index === userVotedIndex;
          const canVote = !hasVoted && !hasEnded && !voting && !removingVote;

          return (
            <div key={index} className="poll-option-wrapper">
              {canSeeResults ? (
                // Show results with vote counts - clickable if user hasn't voted
                <div
                  className={`poll-option-result ${isSelected ? 'selected' : ''} ${canVote ? 'clickable' : ''}`}
                  onClick={canVote ? () => handleVote(index) : undefined}
                  role={canVote ? 'button' : undefined}
                  tabIndex={canVote ? 0 : undefined}
                  onKeyDown={canVote ? (e) => e.key === 'Enter' && handleVote(index) : undefined}
                >
                  <div className="poll-option-bar" style={{ width: `${percentage}%` }} />
                  <div className="poll-option-content">
                    <span className="poll-option-text">{option.text}</span>
                    <span className="poll-option-percentage">{percentage}%</span>
                  </div>
                  {isSelected && <span className="voted-checkmark">✓</span>}
                </div>
              ) : hasVoted && resultsHidden ? (
                // User voted but results are hidden (author-only visibility)
                <div className={`poll-option-result ${isSelected ? 'selected' : ''}`}>
                  <div className="poll-option-content">
                    <span className="poll-option-text">{option.text}</span>
                    {isSelected && <span className="poll-voted-indicator">Your vote</span>}
                  </div>
                  {isSelected && <span className="voted-checkmark">✓</span>}
                </div>
              ) : (
                // Results hidden and user hasn't voted - show buttons only
                <button
                  className="poll-option-button"
                  onClick={() => handleVote(index)}
                  disabled={voting || removingVote || hasEnded}
                >
                  {option.text}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-footer">
        {resultsHidden ? (
          <span className="poll-votes poll-hidden-results">🔒 Results hidden by author</span>
        ) : (
          <span
            className={`poll-votes ${totalVotes > 0 ? 'clickable' : ''}`}
            onClick={totalVotes > 0 ? handleShowVoters : undefined}
            role={totalVotes > 0 ? 'button' : undefined}
            tabIndex={totalVotes > 0 ? 0 : undefined}
          >
            {loadingVoters ? 'Loading...' : `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}`}
          </span>
        )}
        {poll.endsAt && (
          <>
            <span className="poll-separator">•</span>
            <span className={`poll-time ${hasEnded ? 'ended' : ''}`}>
              {formatTimeRemaining()}
            </span>
          </>
        )}
        {poll.allowMultipleVotes && !hasEnded && (
          <>
            <span className="poll-separator">•</span>
            <span className="poll-info">Multiple votes allowed</span>
          </>
        )}
        {hasVoted && !hasEnded && (
          <>
            <span className="poll-separator">•</span>
            <button
              className="poll-remove-vote"
              onClick={handleRemoveVote}
              disabled={removingVote || voting}
            >
              {removingVote ? 'Removing...' : 'Remove my vote'}
            </button>
          </>
        )}
      </div>

      {/* Voter List Modal */}
      {showVoterModal && voterData && (
        <div className="poll-voter-modal-overlay" onClick={() => setShowVoterModal(false)}>
          <div className="poll-voter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="poll-voter-modal-header">
              <h3>📊 {voterData.totalVotes} {voterData.totalVotes === 1 ? 'Vote' : 'Votes'}</h3>
              <button className="poll-voter-modal-close" onClick={() => setShowVoterModal(false)}>×</button>
            </div>
            <div className="poll-voter-modal-content">
              {voterData.options.map((option) => (
                <div key={option.optionIndex} className="poll-voter-option">
                  <div className="poll-voter-option-header">
                    <span className="poll-voter-option-text">{option.optionText}</span>
                    <span className="poll-voter-option-count">({option.voters.length})</span>
                  </div>
                  {option.voters.length > 0 ? (
                    <div className="poll-voter-list">
                      {option.voters.map((voter) => (
                        <Link
                          key={voter._id}
                          to={`/profile/${voter.username}`}
                          className="poll-voter-item"
                          onClick={() => setShowVoterModal(false)}
                          style={{ textDecoration: 'none' }}
                        >
                          <div className="poll-voter-avatar">
                            {voter.profilePhoto ? (
                              <img src={getImageUrl(voter.profilePhoto)} alt={voter.displayName || voter.username} />
                            ) : (
                              <span>{(voter.displayName || voter.username || '?')[0].toUpperCase()}</span>
                            )}
                          </div>
                          <span className="poll-voter-name">{voter.displayName || voter.username}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="poll-no-voters">No votes yet</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Poll;

