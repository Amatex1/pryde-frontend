import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './Legal.css';

/**
 * Phase 6B: Trust & Safety Transparency
 * 
 * A calm, values-based page explaining Pryde's safety rules,
 * moderation flow, and boundaries without exposing private
 * moderation actions or creating anxiety.
 */
function TrustAndSafety() {
  // Apply user's dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link to="/" className="legal-home-button">
          🏠 Home
        </Link>
        <h1>🛡️ Trust & Safety</h1>
        <p className="legal-subtitle">How we keep Pryde a calm, safe space</p>
      </div>

      <div className="legal-content">
        {/* SECTION 1: What Pryde Is */}
        <section className="legal-section">
          <h2>What Pryde Is</h2>
          <p>
            Pryde is a queer-centred social space designed for genuine connection, 
            not clout-chasing or viral content. We prioritise calm, meaningful 
            interactions over engagement metrics and algorithmic pressure.
          </p>
          <ul>
            <li>A community for LGBTQ+ individuals and allies</li>
            <li>A space where you control your experience</li>
            <li>A platform that respects your privacy and boundaries</li>
            <li>A calm alternative to attention-economy social media</li>
          </ul>
        </section>

        {/* SECTION 2: What Pryde Is Not */}
        <section className="legal-section">
          <h2>What Pryde Is Not</h2>
          <ul>
            <li>We are <strong>not</strong> a dating app</li>
            <li>We are <strong>not</strong> an emergency service</li>
            <li>We do <strong>not</strong> track engagement for algorithms</li>
            <li>We do <strong>not</strong> sell your data or show you ads</li>
            <li>We do <strong>not</strong> use shadow-banning or hidden penalties</li>
          </ul>
        </section>

        {/* SECTION 3: Community Expectations */}
        <section className="legal-section">
          <h2>Community Expectations</h2>
          <p>
            We ask everyone on Pryde to treat each other with kindness and respect. 
            This isn't about strict rules — it's about shared values:
          </p>
          <ul>
            <li><strong>Be kind:</strong> Disagreement is fine; cruelty is not</li>
            <li><strong>Be honest:</strong> Don't impersonate others or spread misinformation</li>
            <li><strong>Be respectful:</strong> Respect boundaries, pronouns, and identities</li>
            <li><strong>Be mindful:</strong> Consider how your words affect others</li>
            <li><strong>Be supportive:</strong> Lift each other up, especially in groups</li>
          </ul>
          <p>
            For detailed guidelines, see our{' '}
            <Link to="/community" className="legal-link">Community Guidelines</Link>.
          </p>
        </section>

        {/* SECTION 4: How Reporting Works */}
        <section className="legal-section">
          <h2>How Reporting Works</h2>
          <p>
            Anyone can report content or behaviour that makes them uncomfortable. 
            Here's what happens when you file a report:
          </p>
          <ol>
            <li><strong>You report:</strong> Click the menu (⋯) on a post, message, or profile</li>
            <li><strong>We review:</strong> A human moderator looks at the report</li>
            <li><strong>We decide:</strong> Based on context and our guidelines</li>
            <li><strong>We act:</strong> If needed, we take appropriate steps</li>
          </ol>
          
          <div style={{
            background: 'var(--soft-lavender)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--pryde-purple)' }}>✨ What's Important to Know</h3>
            <ul style={{ marginBottom: 0 }}>
              <li>Reports are <strong>never automated</strong> — humans review everything</li>
              <li>Typical response time: a few hours to a few days</li>
              <li>We never share who reported something</li>
              <li>Reports do not affect any "reputation score" (we don't have one)</li>
            </ul>
          </div>
        </section>

        {/* SECTION 5: What Others Can and Cannot See */}
        <section className="legal-section">
          <h2>What Others Can and Cannot See</h2>
          <p>
            Transparency goes both ways. Here's exactly what is and isn't visible
            to different people on Pryde:
          </p>

          <h3>🔒 Other Users Cannot See:</h3>
          <ul>
            <li>Reports you file</li>
            <li>Reports filed against you</li>
            <li>Group moderation logs (who was muted or removed)</li>
            <li>Any moderation actions taken on your account</li>
            <li>How many times you've been reported (if any)</li>
          </ul>

          <h3>🔐 Admins Cannot See:</h3>
          <ul>
            <li>Your private messages (unless reported)</li>
            <li>Your private journal entries</li>
            <li>Group content (unless they are members or content is reported)</li>
          </ul>

          <h3>📋 Admins Can See (for safety purposes):</h3>
          <ul>
            <li>Reported content that's flagged for review</li>
            <li>Public posts and profile information</li>
            <li>Basic account activity for security (login times, not content)</li>
          </ul>
        </section>

        {/* SECTION 6: Enforcement Outcomes */}
        <section className="legal-section">
          <h2>What Happens If Something Goes Wrong</h2>
          <p>
            We don't use punitive language like "strikes" or "violations."
            Instead, we focus on keeping the community safe while giving people
            room to learn and grow.
          </p>

          <h3>Possible Outcomes:</h3>
          <ul>
            <li>
              <strong>Boundary reminder:</strong> A private message explaining
              what went wrong and how to avoid it
            </li>
            <li>
              <strong>Temporary limits:</strong> Short-term restrictions on
              certain features (like posting or messaging)
            </li>
            <li>
              <strong>Account restrictions:</strong> Longer limitations for
              repeated or serious issues
            </li>
            <li>
              <strong>Account suspension:</strong> Temporary removal from the
              platform (rare, for serious issues)
            </li>
            <li>
              <strong>Permanent removal:</strong> Only for severe violations
              (threats, CSAM, targeted harassment)
            </li>
          </ul>

          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <h3 style={{ marginTop: 0, color: '#2e7d32' }}>💚 Most Actions Are Temporary</h3>
            <p style={{ marginBottom: 0 }}>
              The vast majority of moderation actions are temporary and contextual.
              We believe in second chances and understand that everyone makes mistakes.
              If you disagree with an action, you can reach out to us.
            </p>
          </div>
        </section>

        {/* SECTION 7: Group-Specific Moderation */}
        <section className="legal-section">
          <h2>Groups Are Self-Moderated</h2>
          <p>
            Groups on Pryde are private, self-governed communities. Here's how
            group moderation works:
          </p>
          <ul>
            <li>
              <strong>Group owners set the rules:</strong> Each group can have
              its own boundaries and expectations
            </li>
            <li>
              <strong>Group actions stay in the group:</strong> Being muted or
              removed from a group does NOT affect your global Pryde account
            </li>
            <li>
              <strong>Admins don't interfere:</strong> Platform admins only step
              in if content violates sitewide rules or is reported
            </li>
            <li>
              <strong>You can always leave:</strong> Leaving a group resets any
              group-specific restrictions
            </li>
          </ul>
          <p>
            Think of groups like separate rooms — what happens in one doesn't
            follow you to another.
          </p>
        </section>

        {/* SECTION 8: Data & Privacy */}
        <section className="legal-section">
          <h2>Data & Privacy Transparency</h2>
          <p>
            We believe you should know exactly what we track (and don't track):
          </p>

          <h3>✅ What We Log:</h3>
          <ul>
            <li>Login sessions and security events (for your account safety)</li>
            <li>Basic error logs (to fix bugs)</li>
            <li>Report history (to handle moderation)</li>
          </ul>

          <h3>❌ What We Do NOT Track:</h3>
          <ul>
            <li>Engagement scores or "shadow metrics"</li>
            <li>How long you spend on posts</li>
            <li>Your scrolling or browsing patterns</li>
            <li>Data for advertising or targeting</li>
          </ul>

          <h3>📊 Data Retention:</h3>
          <ul>
            <li>Security logs: ~90 days</li>
            <li>Report history: Kept while relevant, then anonymised</li>
            <li>Deleted content: Removed within 30 days</li>
          </ul>

          <div className="contact-info">
            <p>
              <strong>Want to export or delete your data?</strong><br />
              See our <Link to="/privacy" className="legal-link">Privacy Policy</Link> or
              contact us at <strong>prydeapp-team@outlook.com</strong>
            </p>
          </div>
        </section>

        {/* SECTION 9: More Resources */}
        <section className="legal-section">
          <h2>More Resources</h2>
          <div className="report-methods">
            <div className="report-method">
              <h3>📜 Privacy Policy</h3>
              <p>Full details on how we handle your data</p>
              <Link to="/privacy" className="legal-link">Read Privacy Policy →</Link>
            </div>
            <div className="report-method">
              <h3>📋 Community Guidelines</h3>
              <p>Our expectations for community behaviour</p>
              <Link to="/community" className="legal-link">Read Guidelines →</Link>
            </div>
            <div className="report-method">
              <h3>🛡️ Safety Center</h3>
              <p>Tips for staying safe online</p>
              <Link to="/safety" className="legal-link">Visit Safety Center →</Link>
            </div>
            <div className="report-method">
              <h3>⚖️ Legal Requests</h3>
              <p>For law enforcement and legal matters</p>
              <Link to="/legal-requests" className="legal-link">Legal Requests →</Link>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="legal-footer-note">
          <p>
            <strong>Questions?</strong> Reach out to us at{' '}
            <strong>prydeapp-team@outlook.com</strong>
          </p>
          <p className="last-updated">
            Last Updated: December 2025
          </p>
        </div>
      </div>

      <div className="legal-nav-footer">
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default TrustAndSafety;

