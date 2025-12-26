/**
 * PageErrorBoundary - Error boundary for major page layouts
 * PHASE 3: Prevents white screens by catching errors in layout sections
 * 
 * Features:
 * - Renders fallback UI when errors occur
 * - Never crashes the entire app
 * - Provides retry/recovery options
 * - Logs errors for debugging
 */

import { Component } from 'react';
import logger from '../utils/logger';
import './PageErrorBoundary.css';

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const { pageName = 'Page' } = this.props;
    
    logger.error(`PageErrorBoundary [${pageName}] caught error:`, error);
    console.error(`🔴 [${pageName}] Error:`, error);
    console.error(`🔴 [${pageName}] Component Stack:`, errorInfo?.componentStack);

    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleGoHome = () => {
    window.location.href = '/feed';
  };

  render() {
    const { hasError, error } = this.state;
    const { pageName = 'Page', fallback, children } = this.props;

    if (hasError) {
      // If custom fallback provided, use it
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback({ error, retry: this.handleRetry })
          : fallback;
      }

      // Default fallback UI
      return (
        <div className="page-error-boundary">
          <div className="page-error-content">
            <div className="page-error-icon">⚠️</div>
            <h2 className="page-error-title">Something went wrong</h2>
            <p className="page-error-message">
              {pageName} couldn't load properly. This section may be temporarily unavailable.
            </p>

            {/* Error details in dev mode */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="page-error-details">
                <summary>Error Details</summary>
                <pre>{error.toString()}</pre>
              </details>
            )}

            <div className="page-error-actions">
              <button className="btn-retry" onClick={this.handleRetry}>
                Try Again
              </button>
              <button className="btn-back" onClick={this.handleGoBack}>
                Go Back
              </button>
              <button className="btn-home" onClick={this.handleGoHome}>
                Go to Feed
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default PageErrorBoundary;

