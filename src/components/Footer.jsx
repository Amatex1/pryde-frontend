import { Link } from 'react-router-dom';
import prydeLogo from '../assets/pryde-logo.png';
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
          <a href="/trust-center">Trust Center</a>
          <span className="separator">•</span>
          <a href="/terms">Terms</a>
          <span className="separator">•</span>
          <a href="/privacy">Privacy</a>
          <span className="separator">•</span>
          <a href="/dmca">DMCA</a>
          <span className="separator">•</span>
          <a href="/community-guidelines">Community Guidelines</a>
          <span className="separator">•</span>
          <a href="/security">Security</a>
          <span className="separator">•</span>
          <a href="/faq">FAQ</a>
          <span className="separator">•</span>
          <a href="/contact">Contact</a>
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
