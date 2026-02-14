import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './legal/Legal.css';

/**
 * STEP 3: Safety & Moderation (Merged)
 * 
 * Combines:
 * - Safety.jsx (Safety Center content)
 * - TrustAndSafety.jsx (moderation transparency)
 * 
 * CRITICAL: All original legal language preserved
 * - "Not an emergency service" clause
 * - "Not mandated reporters" clause
 * - "Severe violation reporting" clause
 */
function SafetyModeration() {
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
        <h1>🛡️ Safety & Moderation</h1>
        <p className="legal-subtitle">How we keep Pryde a calm, safe space</p>
      </div>

      <div className="legal-content">
        {/* EMERGENCY BANNER */}
        <div className="emergency-banner" style={{
          background: 'var(--soft-lavender)',
          border: '2px solid var(--pryde-purple)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: 'var(--pryde-purple)', marginTop: 0 }}>⚠️ Important</h2>
          <p>
            <strong>Pryde Social is not an emergency service.</strong>
          </p>
          <p>
            If you are in immediate danger, contact local authorities:
          </p>
          <ul style={{ marginTop: '0.5rem' }}>
            <li><strong>Australia:</strong> 000 (Police, Ambulance, Fire)</li>
            <li><strong>US:</strong> 911</li>
            <li><strong>UK:</strong> 999</li>
            <li><strong>Other countries:</strong> See our <Link to="/helplines" className="legal-link">Global Helplines</Link> page</li>
          </ul>
        </div>

        {/* SECTION 1: What Pryde Is */}
        <section className="legal-section">
          <h2>1. What Pryde Is</h2>
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
          <h2>2. What Pryde Is Not</h2>
          <ul>
            <li>We are <strong>not</strong> a dating app</li>
            <li>We are <strong>not</strong> an emergency service</li>
            <li>We do <strong>not</strong> track engagement for algorithms</li>
            <li>We do <strong>not</strong> sell your data or show you ads</li>
            <li>We do <strong>not</strong> use shadow-banning or hidden penalties</li>
          </ul>
        </section>

        {/* SECTION 3: Staying Safe Online */}
        <section className="legal-section">
          <h2>3. Staying Safe Online</h2>
          <ul>
            <li>Don't share personal information (address, phone number, financial details)</li>
            <li>Use strong, unique passwords</li>
            <li>Be cautious about meeting people in person</li>
            <li>Trust your instincts — if something feels wrong, it probably is</li>
            <li>Report suspicious behavior</li>
          </ul>
        </section>

        {/* SECTION 4: LGBTQ+ Safety Tips */}
        <section className="legal-section">
          <h2>4. LGBTQ+ Safety Tips</h2>
          <ul>
            <li>Control your privacy settings</li>
            <li>Only share what you're comfortable with</li>
            <li>Block users who make you uncomfortable</li>
            <li>Report hate speech or harassment immediately</li>
            <li>You are not obligated to disclose your identity to anyone</li>
            <li><strong>Use Quiet Mode</strong> to hide metrics and reduce social pressure</li>
          </ul>

          <h3>🧘 Quiet Mode for Mental Health</h3>
          <p>
            <strong>Quiet Mode is a safety feature designed to reduce social anxiety and pressure:</strong>
          </p>
          <ul>
            <li>Hides all reaction counts and metrics</li>
            <li>Provides a calmer, less competitive browsing experience</li>
            <li>Reduces comparison and FOMO (fear of missing out)</li>
            <li>Helps protect mental health and wellbeing</li>
          </ul>
          <p>
            Enable Quiet Mode in Settings → Privacy → Quiet Mode
          </p>

          <div style={{
            background: 'rgba(255, 165, 0, 0.1)',
            border: '2px solid #ff8c00',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <h3 style={{ color: '#ff8c00', marginTop: 0 }}>⚠️ Safety in High-Risk Regions</h3>
            <p>
              <strong>If you are in a country where same-sex relationships are criminalised, please take extra precautions:</strong>
            </p>
            <ul style={{ marginTop: '0.5rem' }}>
              <li><strong>Do not use real names</strong> — Use a pseudonym or nickname</li>
              <li><strong>Do not use real photos</strong> — Avoid profile pictures that could identify you</li>
              <li><strong>Do not share identifying details</strong> — Avoid posting your location, workplace, school, or other personal information</li>
              <li><strong>Turn off online status and last seen</strong> — Go to Settings → Privacy to disable these features</li>
              <li><strong>Avoid enabling location</strong> unless it is safe to do so</li>
              <li><strong>Use a VPN</strong> if accessing the platform from a restricted region</li>
              <li><strong>Be cautious about who you connect with</strong> — Verify identities before sharing personal information</li>
            </ul>
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
              Your safety is our priority. If you feel unsafe, please deactivate your account or contact us for assistance.
            </p>
          </div>
        </section>

        {/* SECTION 5: Crisis Support */}
        <section className="legal-section">
          <h2>5. Crisis Support</h2>
          <p>
            <strong>If you're in crisis:</strong>
          </p>

          <h3>🇦🇺 Australia</h3>
          <ul>
            <li><strong>Lifeline:</strong> 13 11 14 (24/7 crisis support)</li>
            <li><strong>Beyond Blue:</strong> 1300 22 4636 (mental health support)</li>
            <li><strong>Suicide Call Back Service:</strong> 1300 659 467</li>
            <li><strong>Kids Helpline:</strong> 1800 55 1800 (ages 5-25)</li>
          </ul>

          <h3>🏳️‍🌈 LGBTQ+ Specific Resources (Australia)</h3>
          <ul>
            <li><strong>QLife:</strong> 1800 184 527 (LGBTQ+ peer support, 3pm-midnight daily)</li>
            <li><strong>QLife Webchat:</strong> <a href="https://qlife.org.au" target="_blank" rel="noopener noreferrer">qlife.org.au</a></li>
            <li><strong>Switchboard Victoria:</strong> 1800 184 527 (LGBTIQ+ support)</li>
            <li><strong>Transgender Victoria:</strong> (03) 9020 4675</li>
          </ul>

          <h3>🌍 International Crisis Support</h3>
          <ul>
            <li><strong>US:</strong> 988 (Suicide & Crisis Lifeline)</li>
            <li><strong>US:</strong> Text HOME to 741741 (Crisis Text Line)</li>
            <li><strong>UK:</strong> 116 123 (Samaritans)</li>
            <li><strong>Trevor Project (US LGBTQ+ youth):</strong> 1-866-488-7386</li>
            <li><strong>Trans Lifeline (US/Canada):</strong> 1-877-565-8860</li>
          </ul>

          <p style={{ marginTop: '1.5rem' }}>
            <strong>📋 For a comprehensive list of helplines worldwide, visit our <Link to="/helplines" className="legal-link">Global Helplines</Link> page.</strong>
          </p>
        </section>

        {/* SECTION 6: How to Block & Report */}
        <section className="legal-section">
          <h2>6. How to Block & Report</h2>

          <h3>🚫 How to Block</h3>
          <p>
            <strong>To block a user:</strong>
          </p>
          <ul>
            <li>Go to their profile</li>
            <li>Click the three-dot menu (⋯)</li>
            <li>Select "Block User"</li>
            <li>Confirm</li>
          </ul>
          <p>
            <strong>What blocking does:</strong>
          </p>
          <ul>
            <li>They can't see your posts or profile</li>
            <li>They can't message you</li>
            <li>You won't see their content</li>
            <li>They won't be notified</li>
          </ul>

          <h3>📢 How to Report</h3>
          <p>
            <strong>To report a post:</strong>
          </p>
          <ul>
            <li>Click the three-dot menu (⋯) on the post</li>
            <li>Select "Report Post"</li>
            <li>Choose the reason</li>
            <li>Submit</li>
          </ul>
          <p>
            <strong>To report a user:</strong>
          </p>
          <ul>
            <li>Go to their profile</li>
            <li>Click the three-dot menu (⋯)</li>
            <li>Select "Report User"</li>
            <li>Describe the issue</li>
          </ul>
          <p>
            <strong>To report a message:</strong>
          </p>
          <ul>
            <li>Open the conversation</li>
            <li>Right-click or long-press the message</li>
            <li>Select "Report Message"</li>
            <li>Provide details</li>
          </ul>
          <p>
            <strong>To report a Lounge message:</strong>
          </p>
          <ul>
            <li>Click the three-dot menu (⋯) on the message in Lounge</li>
            <li>Select "Report Message"</li>
            <li>Choose the reason</li>
            <li>Submit</li>
          </ul>
          <p>
            <strong>To report a GIF:</strong> Report the post or message containing the inappropriate GIF using the methods above.
          </p>
        </section>

        {/* SECTION 7: How Reporting Works */}
        <section className="legal-section">
          <h2>7. How Reporting Works</h2>
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

        {/* SECTION 8: What Admins Can and Cannot See */}
        <section className="legal-section">
          <h2>8. What Admins Can and Cannot See</h2>
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

        {/* SECTION 9: Enforcement Outcomes */}
        <section className="legal-section">
          <h2>9. What Happens If Something Goes Wrong</h2>
          <p>
            <strong>We approach moderation as care and protection, not punishment.</strong>
          </p>
          <p>
            When we receive reports, we review them carefully and may:
          </p>
          <ul>
            <li>Remove harmful content to protect the community</li>
            <li>Issue private warnings with guidance</li>
            <li>Temporarily restrict access to certain features (Lounge, reactions, messaging)</li>
            <li>Temporarily suspend accounts</li>
            <li>Permanently ban accounts for severe violations</li>
          </ul>
          <p>
            <strong>Severe violations</strong> (CSAM, credible threats, hate speech, targeted harassment) result in immediate permanent bans.
          </p>
          <p>
            Our goal is to keep everyone safe while giving people room to learn and grow.
          </p>

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

        {/* SECTION 10: Group-Specific Moderation */}
        <section className="legal-section">
          <h2>10. Groups Are Self-Moderated</h2>
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

        {/* SECTION 11: We Are Not Mandated Reporters */}
        <section className="legal-section">
          <h2>11. We Are Not Mandated Reporters</h2>
          <p>
            Pryde Social is a hobby-operated platform. We are not mandated reporters and do not automatically forward user issues to authorities.
          </p>
          <p>
            <strong>However:</strong> We may report severe violations (CSAM, credible threats, illegal activity) to law enforcement when necessary.
          </p>
        </section>

        {/* SECTION 12: Data & Privacy Transparency */}
        <section className="legal-section">
          <h2>12. Data & Privacy Transparency</h2>
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

        {/* SECTION 13: Contact */}
        <section className="legal-section">
          <h2>13. Contact</h2>
          <div className="contact-info">
            <p><strong>📧</strong> <span className="contact-email">prydeapp-team@outlook.com</span></p>
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

export default SafetyModeration;

