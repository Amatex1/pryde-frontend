import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './legal/Legal.css';

/**
 * STEP 6: Security Overview (Simplified)
 * 
 * Simplified version of Security.jsx with no PDF embeds
 * All content in styled HTML format
 */
function SecurityOverview() {
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
        <h1>🔒 Security Overview</h1>
        <p className="legal-subtitle">How we protect your data and keep Pryde safe</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Overview</h2>
          <p>
            At Pryde Social, we take your security seriously. This page outlines the technical and organizational measures we implement to protect your data and ensure a safe platform for the LGBTQ+ community.
          </p>
          <p>
            <strong>Our commitment:</strong> We use industry-standard security practices to safeguard your personal information, prevent unauthorized access, and maintain the integrity of our platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Data Encryption</h2>
          
          <h3>Encryption in Transit</h3>
          <ul>
            <li><strong>HTTPS/TLS:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.2 or higher</li>
            <li><strong>Secure WebSockets:</strong> Real-time features (messaging, notifications) use encrypted WebSocket connections (WSS)</li>
            <li><strong>API Security:</strong> All API endpoints require secure HTTPS connections</li>
          </ul>

          <h3>Encryption at Rest</h3>
          <ul>
            <li><strong>Password Hashing:</strong> Passwords are hashed using bcrypt with salt rounds (never stored in plain text)</li>
            <li><strong>Database Encryption:</strong> Sensitive data is encrypted at the database level</li>
            <li><strong>File Storage:</strong> Uploaded media files are stored securely with access controls</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Authentication & Access Control</h2>
          
          <h3>Account Security</h3>
          <ul>
            <li><strong>Secure Login:</strong> JWT (JSON Web Token) based authentication with expiration</li>
            <li><strong>Session Management:</strong> Automatic session timeout after inactivity</li>
            <li><strong>Password Requirements:</strong> Minimum 8 characters with complexity requirements</li>
            <li><strong>Account Recovery:</strong> Secure password reset via email verification</li>
          </ul>

          <h3>Access Controls</h3>
          <ul>
            <li><strong>Role-Based Access:</strong> Users can only access their own data and public content</li>
            <li><strong>Privacy Controls:</strong> Granular privacy settings for posts, profile, and visibility</li>
            <li><strong>Blocking & Reporting:</strong> Tools to block users and report inappropriate content</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Infrastructure Security</h2>
          
          <h3>Hosting & Servers</h3>
          <ul>
            <li><strong>Cloud Infrastructure:</strong> Hosted on secure, reputable cloud providers (Render)</li>
            <li><strong>Server Hardening:</strong> Regular security updates and patches</li>
            <li><strong>Firewall Protection:</strong> Network-level firewalls to prevent unauthorized access</li>
            <li><strong>DDoS Protection:</strong> Cloudflare protection against distributed denial-of-service attacks</li>
          </ul>

          <h3>Database Security</h3>
          <ul>
            <li><strong>MongoDB Security:</strong> Authentication required, IP whitelisting, encrypted connections</li>
            <li><strong>Regular Backups:</strong> Automated daily backups with encryption</li>
            <li><strong>Access Logging:</strong> All database access is logged and monitored</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Privacy & Data Protection</h2>
          
          <h3>Data Minimization</h3>
          <ul>
            <li>We only collect data necessary for platform functionality</li>
            <li>Optional fields remain optional (gender, orientation, location, etc.)</li>
            <li>You control what information is visible on your profile</li>
          </ul>

          <h3>Private Messages</h3>
          <ul>
            <li><strong>Privacy:</strong> Private messages are not monitored or read by staff</li>
            <li><strong>Access:</strong> Messages are only accessed when reported for safety/legal reasons</li>
            <li><strong>Retention:</strong> Messages are stored securely and can be deleted by users</li>
          </ul>
          <p>
            See our <Link to="/privacy" className="legal-link">Privacy Policy</Link> and <Link to="/terms" className="legal-link">Terms of Service</Link> for more details.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Threat Detection & Prevention</h2>
          
          <h3>Automated Security</h3>
          <ul>
            <li><strong>Rate Limiting:</strong> Protection against brute force attacks and spam</li>
            <li><strong>Input Validation:</strong> All user input is sanitized to prevent injection attacks</li>
            <li><strong>XSS Protection:</strong> Cross-site scripting prevention measures</li>
            <li><strong>CSRF Protection:</strong> Cross-site request forgery tokens on all forms</li>
          </ul>

          <h3>Content Moderation</h3>
          <ul>
            <li><strong>Reporting System:</strong> Users can report inappropriate content, harassment, or violations</li>
            <li><strong>Review Process:</strong> Reported content is reviewed by moderators</li>
            <li><strong>Account Actions:</strong> Warnings, suspensions, or bans for policy violations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Security Monitoring & Incident Response</h2>

          <h3>Continuous Monitoring</h3>
          <ul>
            <li><strong>Server Monitoring:</strong> 24/7 automated monitoring of server health and security</li>
            <li><strong>Error Tracking:</strong> Automated error logging and alerting</li>
            <li><strong>Access Logs:</strong> All authentication attempts and admin actions are logged</li>
            <li><strong>Anomaly Detection:</strong> Unusual activity patterns trigger alerts</li>
          </ul>

          <h3>Incident Response</h3>
          <ul>
            <li><strong>Response Team:</strong> Dedicated team to handle security incidents</li>
            <li><strong>Breach Notification:</strong> Users will be notified within 72 hours of any data breach</li>
            <li><strong>Investigation:</strong> All security incidents are investigated and documented</li>
            <li><strong>Remediation:</strong> Immediate action to patch vulnerabilities and prevent recurrence</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. User Account Security</h2>

          <h3>Best Practices for Users</h3>
          <ul>
            <li><strong>Strong Passwords:</strong> Use unique, complex passwords (minimum 8 characters)</li>
            <li><strong>Don't Share Credentials:</strong> Never share your password with anyone</li>
            <li><strong>Logout on Shared Devices:</strong> Always log out when using public/shared computers</li>
            <li><strong>Verify Links:</strong> Be cautious of phishing attempts - we'll never ask for your password via email</li>
            <li><strong>Report Suspicious Activity:</strong> Contact us immediately if you notice unauthorized access</li>
          </ul>

          <h3>Account Recovery</h3>
          <ul>
            <li><strong>Email Verification:</strong> Password resets require email verification</li>
            <li><strong>Secure Reset Links:</strong> Reset links expire after 1 hour</li>
            <li><strong>Account Support:</strong> Contact us at <span className="contact-email">prydeapp-team@outlook.com</span> for account issues</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Third-Party Security</h2>

          <h3>Service Providers</h3>
          <p>We carefully vet all third-party services we use:</p>
          <ul>
            <li><strong>Hosting:</strong> Render (secure cloud infrastructure)</li>
            <li><strong>CDN:</strong> Cloudflare (DDoS protection, SSL/TLS)</li>
            <li><strong>Email:</strong> Secure email service providers for notifications</li>
            <li><strong>Media Storage:</strong> Secure cloud storage with encryption</li>
          </ul>

          <h3>No Data Selling</h3>
          <ul>
            <li>We <strong>never sell</strong> your data to third parties</li>
            <li>We <strong>never share</strong> your data with advertisers</li>
            <li>Third-party services are used only for platform functionality</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>10. LGBTQ+ Safety Considerations</h2>

          <h3>Privacy for High-Risk Users</h3>
          <p>
            We understand that LGBTQ+ individuals in certain regions face unique safety risks. Our <Link to="/safety-moderation" className="legal-link">Safety & Moderation</Link> page provides:
          </p>
          <ul>
            <li><strong>Location Privacy:</strong> Option to hide or disable location sharing</li>
            <li><strong>Online Status:</strong> Option to hide online status and last seen</li>
            <li><strong>Profile Visibility:</strong> Control who can see your profile and posts</li>
            <li><strong>Anonymous Browsing:</strong> Browse without revealing your identity</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>11. Vulnerability Disclosure</h2>

          <h3>Responsible Disclosure</h3>
          <p>
            If you discover a security vulnerability, please report it responsibly:
          </p>
          <ul>
            <li><strong>Email:</strong> <span className="contact-email">prydeapp-team@outlook.com</span> with subject "Security Vulnerability"</li>
            <li><strong>Include:</strong> Detailed description, steps to reproduce, and potential impact</li>
            <li><strong>Do Not:</strong> Publicly disclose the vulnerability before we've had time to fix it</li>
            <li><strong>Response Time:</strong> We aim to respond within 48 hours</li>
          </ul>

          <h3>Bug Bounty</h3>
          <p>
            While we don't currently offer a formal bug bounty program, we deeply appreciate responsible disclosure and will acknowledge security researchers who help us improve platform security.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Contact & Support</h2>

          <h3>Security Concerns</h3>
          <p>
            If you have security concerns or questions:
          </p>
          <div className="contact-info">
            <p><strong>📧 Email:</strong> <span className="contact-email">prydeapp-team@outlook.com</span></p>
            <p><strong>Subject Line:</strong> "Security Inquiry" or "Security Vulnerability"</p>
          </div>

          <h3>Related Resources</h3>
          <ul>
            <li><Link to="/privacy" className="legal-link">Privacy Policy</Link> - How we handle your data</li>
            <li><Link to="/terms" className="legal-link">Terms of Service</Link> - Platform rules and responsibilities</li>
            <li><Link to="/safety-moderation" className="legal-link">Safety & Moderation</Link> - LGBTQ+ safety resources and tips</li>
            <li><Link to="/community-guidelines" className="legal-link">Community Guidelines</Link> - Expected behavior on the platform</li>
          </ul>
        </section>

        <div className="legal-footer-note">
          <p>
            <strong>Last Updated:</strong> November 27, 2025
          </p>
        </div>
      </div>

      <div className="legal-nav-footer">
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default SecurityOverview;

