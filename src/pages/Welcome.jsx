import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Welcome.css';

/**
 * Welcome Page - Soft Landing for New Users
 * 
 * Shown immediately after successful registration + optional passkey step.
 * Calm, minimal layout with equal-weight choices (no highlighted button).
 * 
 * Options:
 * - "Take a quick look around" → Tour opt-in gate
 * - "Write something just for me" → Private journal entry
 * - "I'll explore on my own" → Feed
 */
function Welcome() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  // Save that user has seen the welcome page
  const markWelcomeSeen = useCallback(async () => {
    try {
      await api.post('/auth/onboarding/welcome-seen');
      updateUser?.({ onboardingStep: 'welcome_seen' });
    } catch (error) {
      console.error('Failed to save welcome seen status:', error);
    }
  }, [updateUser]);

  // Option 1: Take a quick look around → Tour opt-in
  const handleTakeTour = useCallback(async () => {
    await markWelcomeSeen();
    navigate('/tour-intro');
  }, [markWelcomeSeen, navigate]);

  // Option 2: Write something just for me → Journal
  const handleWriteJournal = useCallback(async () => {
    await markWelcomeSeen();
    navigate('/journal');
  }, [markWelcomeSeen, navigate]);

  // Option 3: I'll explore on my own → Feed
  const handleExplore = useCallback(async () => {
    await markWelcomeSeen();
    navigate('/feed');
  }, [markWelcomeSeen, navigate]);

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-content">
          <h1 className="welcome-title">You're in.</h1>
          
          <div className="welcome-body">
            <p>Take a breath.</p>
            <p>There's nothing you need to do next.</p>
          </div>

          <div className="welcome-options">
            <button
              className="welcome-option"
              onClick={handleTakeTour}
              type="button"
            >
              Take a quick look around
            </button>
            
            <button
              className="welcome-option"
              onClick={handleWriteJournal}
              type="button"
            >
              Write something just for me
            </button>
            
            <button
              className="welcome-option"
              onClick={handleExplore}
              type="button"
            >
              I'll explore on my own
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

