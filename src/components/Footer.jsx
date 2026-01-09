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
            <source srcSet="/icon-192.webp" type="image/webp" />
            <img
              src="/icon-192.png"
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

        {/* Legal Links */}
        <div className="footer-links-container">
          <a href="/guarantees">Platform Guarantees</a>
          <span className="separator">•</span>
          <a href="/terms">Terms of Service</a>
          <span className="separator">•</span>
          <a href="/privacy">Privacy Policy</a>
          <span className="separator">•</span>
          <a href="/trust-safety">Trust & Safety</a>
          <span className="separator">•</span>
          <a href="/security">Security</a>
          <span className="separator">•</span>
          <a href="/community">Community Guidelines</a>
          <span className="separator">•</span>
          <a href="/acceptable-use">Acceptable Use</a>
          <span className="separator">•</span>
          <a href="/safety">Safety Center</a>
          <span className="separator">•</span>
          <a href="/cookies">Cookie Policy</a>
          <span className="separator">•</span>
          <a href="/dmca">DMCA</a>
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
