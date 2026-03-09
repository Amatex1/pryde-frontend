import { Component } from 'react';
import logger from '../utils/logger';
import { captureException } from '../utils/sentry';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('[Pryde] ERROR BOUNDARY CAUGHT:', error);
    console.error('[Pryde] ERROR INFO:', errorInfo);
    console.error('[Pryde] ERROR STACK:', error.stack);

    this.setState({
      error,
      errorInfo
    });

    // Report to Sentry (production only, no PII)
    captureException(error, { component: 'ErrorBoundary' });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoToFeed = () => {
    window.location.href = '/feed';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'var(--card-surface, #ffffff)',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '1rem',
              color: 'var(--color-text)'
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{ 
              marginBottom: '2rem',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6'
            }}>
              We're sorry, but something unexpected happened. 
              Try refreshing the page or going back to the feed.
            </p>

            {/* Error details - always show for debugging */}
            {this.state.error && (
              <details open style={{
                marginBottom: '2rem',
                textAlign: 'left',
                background: 'var(--color-surface-muted)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <pre style={{
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  color: 'var(--color-danger)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid var(--accent-primary)',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                onFocus={(e) => e.target.style.transform = 'translateY(-2px)'}
                onBlur={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid var(--accent-secondary)',
                  background: 'transparent',
                  color: 'var(--accent-secondary)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'var(--accent-secondary)';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--accent-secondary)';
                }}
                onFocus={(e) => {
                  e.target.style.background = 'var(--accent-secondary)';
                  e.target.style.color = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--accent-secondary)';
                }}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleGoToFeed}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #616161',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'var(--color-text-secondary)';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--color-text-secondary)';
                }}
                onFocus={(e) => {
                  e.target.style.background = 'var(--color-text-secondary)';
                  e.target.style.color = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--color-text-secondary)';
                }}
              >
                Go to Feed
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

