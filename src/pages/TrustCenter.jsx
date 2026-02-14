import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './legal/Legal.css';

function TrustCenter() {
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
        <h1>🛡️ Trust Center</h1>
        <p className="legal-subtitle">Transparency, safety, and legal clarity — all in one place.</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-xl)' }}>
            Welcome to the Pryde Social Trust Center. Here you'll find everything you need to know about our policies, 
            safety practices, and commitment to the LGBTQ+ community.
          </p>
        </section>

        {/* SECTION 1: Legal */}
        <section className="legal-section">
          <h2 style={{ color: 'var(--pryde-purple)', marginBottom: 'var(--space-md)' }}>📜 Legal</h2>
          <div className="report-methods">
            <div className="report-method">
              <h3>Terms of Service</h3>
              <p>Our platform rules, user responsibilities, and legal agreements</p>
              <Link to="/terms" className="legal-link">Read Terms →</Link>
            </div>
            <div className="report-method">
              <h3>Privacy Policy</h3>
              <p>How we collect, use, and protect your personal information</p>
              <Link to="/privacy" className="legal-link">Read Privacy Policy →</Link>
            </div>
            <div className="report-method">
              <h3>DMCA Copyright Policy</h3>
              <p>Copyright infringement reporting and takedown procedures</p>
              <Link to="/dmca" className="legal-link">Read DMCA Policy →</Link>
            </div>
          </div>
        </section>

        {/* SECTION 2: Community & Safety */}
        <section className="legal-section">
          <h2 style={{ color: 'var(--pryde-purple)', marginBottom: 'var(--space-md)' }}>🌈 Community & Safety</h2>
          <div className="report-methods">
            <div className="report-method">
              <h3>Community Guidelines</h3>
              <p>Our standards for respectful, inclusive community interaction</p>
              <Link to="/community-guidelines" className="legal-link">Read Guidelines →</Link>
            </div>
            <div className="report-method">
              <h3>Safety & Moderation</h3>
              <p>How we keep Pryde safe, reporting tools, and moderation practices</p>
              <Link to="/safety-moderation" className="legal-link">Learn About Safety →</Link>
            </div>
          </div>
        </section>

        {/* SECTION 3: Transparency */}
        <section className="legal-section">
          <h2 style={{ color: 'var(--pryde-purple)', marginBottom: 'var(--space-md)' }}>🔒 Transparency</h2>
          <div className="report-methods">
            <div className="report-method">
              <h3>Security Overview</h3>
              <p>Our technical security measures, encryption, and data protection</p>
              <Link to="/security" className="legal-link">View Security →</Link>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="legal-section">
          <h2 style={{ color: 'var(--pryde-purple)', marginBottom: 'var(--space-md)' }}>📚 Additional Resources</h2>
          <div className="report-methods">
            <div className="report-method">
              <h3>FAQ</h3>
              <p>Frequently asked questions about Pryde Social</p>
              <Link to="/faq" className="legal-link">View FAQ →</Link>
            </div>
            <div className="report-method">
              <h3>Contact Us</h3>
              <p>Get in touch with our team for support or inquiries</p>
              <Link to="/contact" className="legal-link">Contact →</Link>
            </div>
            <div className="report-method">
              <h3>Crisis Helplines</h3>
              <p>Global LGBTQ+ crisis support and emergency resources</p>
              <Link to="/helplines" className="legal-link">View Helplines →</Link>
            </div>
            <div className="report-method">
              <h3>Legal Requests</h3>
              <p>For law enforcement and legal matters</p>
              <Link to="/legal-requests" className="legal-link">Legal Requests →</Link>
            </div>
          </div>
        </section>

        <div className="legal-footer-note">
          <p>
            <strong>Questions or concerns?</strong> Contact us at{' '}
            <span className="contact-email">prydeapp-team@outlook.com</span>
          </p>
        </div>
      </div>

      <div className="legal-nav-footer">
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default TrustCenter;

