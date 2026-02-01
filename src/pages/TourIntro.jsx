import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './TourIntro.css';

/**
 * Tour Introduction Page - Opt-In Gate for Onboarding Tour
 * 
 * Shown when user clicks "Take a quick look around" from Welcome page.
 * Offers choice to see the tour or skip it entirely.
 * 
 * Options:
 * - "Yes, show me around" → Opens onboarding tour modal
 * - "I'll figure it out" → Goes to feed, saves tourDismissed flag
 */
function TourIntro() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Option 1: Yes, show me around → Show tour
  const handleShowTour = useCallback(async () => {
    setIsLoading(true);
    try {
      // Navigate to feed and trigger the tour
      // The tour will be shown via App.jsx's showTour state
      updateUser?.({ showTour: true });
      navigate('/feed');
    } catch (error) {
      console.error('Failed to start tour:', error);
      navigate('/feed');
    }
  }, [navigate, updateUser]);

  // Option 2: I'll figure it out → Skip tour, go to feed
  const handleSkipTour = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/onboarding/tour-dismissed');
      updateUser?.({ 
        onboardingTourDismissed: true, 
        showTour: false,
        hasSkippedTour: true 
      });
    } catch (error) {
      console.error('Failed to save tour dismissed status:', error);
    }
    navigate('/feed');
  }, [navigate, updateUser]);

  return (
    <div className="tour-intro-container">
      <div className="tour-intro-card">
        <div className="tour-intro-content">
          <h1 className="tour-intro-title">Would you like a quick introduction?</h1>
          
          <p className="tour-intro-body">
            A short, gentle walkthrough — or you can skip and explore freely.
          </p>

          <div className="tour-intro-options">
            <button
              className="tour-intro-option"
              onClick={handleShowTour}
              disabled={isLoading}
              type="button"
            >
              Yes, show me around
            </button>
            
            <button
              className="tour-intro-option"
              onClick={handleSkipTour}
              disabled={isLoading}
              type="button"
            >
              I'll figure it out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TourIntro;

