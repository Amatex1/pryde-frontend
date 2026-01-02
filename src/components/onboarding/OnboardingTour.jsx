import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './OnboardingTour.css';

/**
 * OnboardingTour Component
 * 
 * A calm, optional post-signup tour introducing new users to Pryde Social.
 * 
 * Features:
 * - 5-step modal tour with calm messaging
 * - Keyboard accessible (ESC to close, Tab trap)
 * - Mobile friendly
 * - Respects Dark Mode and Quiet Mode
 * - Non-blocking, dismissible at any step
 * - Persists state to database (not localStorage)
 * 
 * Trigger conditions:
 * - After first successful signup
 * - On first login if hasCompletedTour === false && hasSkippedTour === false
 */

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Pryde',
    body: "This is a calmer LGBTQ+ space.\nThere's no rush, no pressure, and no expectation to perform.",
    showActions: false
  },
  {
    id: 'feed',
    title: 'No algorithms here',
    body: "Pryde shows posts in time order.\nWhat you see isn't ranked by popularity or engagement.",
    showActions: false
  },
  {
    id: 'quiet',
    title: "You don't have to post",
    body: "Lurking is welcome.\nReading quietly is a valid way to belong here.",
    showActions: false
  },
  {
    id: 'usage',
    title: 'How people use Pryde',
    body: "People write reflections, respond to prompts, save things that resonate,\nor simply check in when they need a quieter space.",
    showActions: false
  },
  {
    id: 'start',
    title: "If you'd like to start",
    body: "You can begin with something small — or nothing at all.",
    showActions: true
  }
];

function OnboardingTour({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Store trigger element and handle focus
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus the modal for screen readers
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle skip tour
  const handleSkip = useCallback(async () => {
    setIsClosing(true);
    try {
      await api.post('/auth/tour/skip');
    } catch (error) {
      console.error('Failed to save tour skip status:', error);
    }
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setCurrentStep(0);
    }, 150);
  }, [onClose]);

  // Handle complete tour
  const handleFinish = useCallback(async () => {
    setIsClosing(true);
    try {
      await api.post('/auth/tour/complete');
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }
    if (onComplete) onComplete();
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setCurrentStep(0);
    }, 150);
  }, [onClose, onComplete]);

  // Navigation handlers
  const handleNext = () => {
    if (!isLastStep) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (!isFirstStep) setCurrentStep(prev => prev - 1);
  };

  // Action handlers for final step
  const handleWriteJournal = useCallback(async () => {
    setIsClosing(true);
    try {
      await api.post('/auth/tour/complete');
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }
    if (onComplete) onComplete();
    onClose();
    setIsClosing(false);
    setCurrentStep(0);
    // Navigate to journal page (use existing route)
    navigate('/journal');
  }, [onClose, onComplete, navigate]);

  const handleViewPrompt = useCallback(async () => {
    setIsClosing(true);
    try {
      await api.post('/auth/tour/complete');
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }
    if (onComplete) onComplete();
    onClose();
    setIsClosing(false);
    setCurrentStep(0);
    // Navigate to feed where prompts appear (no dedicated /prompts route exists)
    navigate('/feed');
  }, [onClose, onComplete, navigate]);

  // Focus trap and keyboard handling
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || !modalRef.current) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      handleSkip();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [isOpen, handleSkip]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className={`onboarding-overlay ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
    >
      <div 
        ref={modalRef}
        className={`onboarding-modal ${isClosing ? 'closing' : ''}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator (subtle dots) */}
        <div className="tour-step-indicator" aria-label={`Step ${currentStep + 1} of ${TOUR_STEPS.length}`}>
          {TOUR_STEPS.map((_, index) => (
            <span 
              key={index} 
              className={`tour-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Content */}
        <div className="tour-content">
          <h2 id="tour-title" className="tour-title">{step.title}</h2>
          <p id="tour-body" className="tour-body">
            {step.body.split('\n').map((line, i) => (
              <span key={i}>{line}{i < step.body.split('\n').length - 1 && <br />}</span>
            ))}
          </p>

          {/* Optional action buttons on final step */}
          {step.showActions && (
            <div className="tour-actions-optional">
              <button
                className="tour-action-btn"
                onClick={handleWriteJournal}
                type="button"
              >
                📝 Start a journal entry
              </button>
              <button
                className="tour-action-btn"
                onClick={handleViewPrompt}
                type="button"
              >
                💭 Browse the feed
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="tour-navigation">
          <button 
            className="tour-btn tour-btn-skip"
            onClick={handleSkip}
            type="button"
            aria-label="Skip tour and don't show again"
          >
            Skip tour
          </button>

          <div className="tour-nav-main">
            {!isFirstStep && (
              <button 
                className="tour-btn tour-btn-back"
                onClick={handleBack}
                type="button"
              >
                Back
              </button>
            )}
            
            {isLastStep ? (
              <button 
                className="tour-btn tour-btn-primary"
                onClick={handleFinish}
                type="button"
              >
                Finish
              </button>
            ) : (
              <button 
                className="tour-btn tour-btn-primary"
                onClick={handleNext}
                type="button"
                autoFocus
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTour;

