import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        {/* Site Name and Copyright */}
        <div className="footer-branding">
          <picture>
            <source srcSet="/pryde-logo.webp" type="image/webp" />
            <img
              src="/pryde-logo.png"
              alt="Pryde Social Logo"
              className="footer-logo-img"
              width="50"
              height="50"
              loading="lazy"
            />
          </picture>
          <h3 className="footer-logo">Pryde Social</h3>
          <p className="footer-copyright">
            © {currentYear} Pryde Social. All rights reserved.
          </p>
        </div>

        {/* Legal Links - Consolidated */}
        <div className="footer-links-container">
          <Link to="/trust-center">Trust Center</Link>
          <span className="separator">•</span>
          <Link to="/guarantees">Platform Guarantees</Link>
          <span className="separator">•</span>
          <Link to="/terms">Terms</Link>
          <span className="separator">•</span>
          <Link to="/privacy">Privacy</Link>
          <span className="separator">•</span>
          <Link to="/dmca">DMCA</Link>
          <span className="separator">•</span>
          <Link to="/community-guidelines">Community Guidelines</Link>
          <span className="separator">•</span>
          <Link to="/safety">Safety</Link>
          <span className="separator">•</span>
          <Link to="/security">Security</Link>
          <span className="separator">•</span>
          <Link to="/faq">FAQ</Link>
          <span className="separator">•</span>
          <Link to="/contact">Contact</Link>
        </div>
      </div>

      {/* Age Notice */}
      <div className="footer-notice">
        <p>Pryde Social is for users 18+ only. By using this platform, you confirm you are 18 years of age or older.</p>
      </div>
    </footer>
  );
}

export default Footer;
