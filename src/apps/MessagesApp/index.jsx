/**
 * MessagesApp — Feature Flag Router
 * 
 * Phase 1 Scaffold: Routes between legacy and new implementation.
 * 
 * Environment Variable:
 *   VITE_USE_NEW_MESSAGES_APP=true  → Use new MessagesApp
 *   VITE_USE_NEW_MESSAGES_APP=false → Use legacy Messages (default)
 * 
 * This allows parallel testing and safe rollback.
 */

import React from 'react';
import './MessagesLoadingSkeleton.css';

// Feature flag - defaults to legacy implementation
const USE_NEW_MESSAGES_APP = 
  import.meta.env.VITE_USE_NEW_MESSAGES_APP === 'true';

// Lazy load both implementations
const MessagesApp = React.lazy(() => import('./MessagesApp'));
const LegacyMessages = React.lazy(() => import('../../pages/Messages'));

const THREAD_PLACEHOLDERS = ['72%', '58%', '65%', '54%', '70%', '60%', '48%'];
const MESSAGE_PLACEHOLDERS = [
  { side: 'received', width: '42%' },
  { side: 'received', width: '58%' },
  { side: 'sent', width: '46%' },
  { side: 'received', width: '64%' },
  { side: 'sent', width: '38%' },
];

// Loading fallback
export function MessagesLoadingSkeleton() {
  return (
    <div className="messages-loading-skeleton" role="status" aria-label="Loading messages">
      <div className="messages-loading-skeleton__navbar" aria-hidden="true">
        <div className="messages-loading-skeleton__brand shimmer-block" />
        <div className="messages-loading-skeleton__nav-actions">
          <span className="messages-loading-skeleton__circle shimmer-block" />
          <span className="messages-loading-skeleton__circle shimmer-block" />
          <span className="messages-loading-skeleton__circle shimmer-block" />
        </div>
      </div>

      <div className="messages-loading-skeleton__layout">
        <aside className="messages-loading-skeleton__threads" aria-label="Loading conversations">
          <div className="messages-loading-skeleton__threads-header" aria-hidden="true">
            <div className="messages-loading-skeleton__title shimmer-block" />
            <div className="messages-loading-skeleton__tabs shimmer-block" />
            <div className="messages-loading-skeleton__search shimmer-block" />
          </div>

          <ul className="messages-loading-skeleton__thread-list" aria-label="Conversation placeholders">
            {THREAD_PLACEHOLDERS.map((previewWidth, index) => (
              <li key={`thread-${index}`} className="messages-loading-skeleton__thread">
                <span className="messages-loading-skeleton__avatar shimmer-block" aria-hidden="true" />
                <div className="messages-loading-skeleton__thread-copy" aria-hidden="true">
                  <div className="messages-loading-skeleton__thread-topline">
                    <span className="messages-loading-skeleton__line shimmer-block" style={{ width: `${46 + (index % 3) * 8}%` }} />
                    <span className="messages-loading-skeleton__meta shimmer-block" />
                  </div>
                  <span className="messages-loading-skeleton__line shimmer-block" style={{ width: previewWidth }} />
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="messages-loading-skeleton__chat" aria-label="Loading current conversation">
          <header className="messages-loading-skeleton__chat-header" aria-hidden="true">
            <span className="messages-loading-skeleton__avatar messages-loading-skeleton__avatar--header shimmer-block" />
            <div className="messages-loading-skeleton__chat-heading">
              <span className="messages-loading-skeleton__line shimmer-block" style={{ width: '142px' }} />
              <span className="messages-loading-skeleton__line shimmer-block" style={{ width: '84px', height: '10px' }} />
            </div>
            <span className="messages-loading-skeleton__chip shimmer-block" />
          </header>

          <div className="messages-loading-skeleton__chat-body">
            <div className="messages-loading-skeleton__date-pill shimmer-block" aria-hidden="true" />

            <ul className="messages-loading-skeleton__message-list" aria-label="Message placeholders">
              {MESSAGE_PLACEHOLDERS.map((bubble, index) => (
                <li
                  key={`message-${index}`}
                  className={`messages-loading-skeleton__message messages-loading-skeleton__message--${bubble.side}`}
                >
                  <span className="messages-loading-skeleton__bubble shimmer-block" style={{ width: bubble.width }} aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>

          <div className="messages-loading-skeleton__composer" aria-hidden="true">
            <div className="messages-loading-skeleton__composer-tools">
              <span className="messages-loading-skeleton__circle messages-loading-skeleton__circle--sm shimmer-block" />
              <span className="messages-loading-skeleton__circle messages-loading-skeleton__circle--sm shimmer-block" />
            </div>
            <span className="messages-loading-skeleton__composer-input shimmer-block" />
            <span className="messages-loading-skeleton__send shimmer-block" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function MessagesRouter(props) {
  const SelectedComponent = USE_NEW_MESSAGES_APP ? MessagesApp : LegacyMessages;
  
  return (
    <React.Suspense fallback={<MessagesLoadingSkeleton />}>
      {React.createElement(SelectedComponent, props)}
    </React.Suspense>
  );
}

