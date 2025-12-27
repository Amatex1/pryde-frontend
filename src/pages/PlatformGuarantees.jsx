import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './legal/Legal.css';

function PlatformGuarantees() {
  // Apply user's theme preference
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
        <h1>🌈 Platform Guarantees</h1>
        <p className="legal-subtitle">What Pryde Promises — In Plain Language</p>
      </div>

      <div className="legal-content">
        {/* What Pryde Will Always Be */}
        <section className="legal-section">
          <h2>🌿 What Pryde Will Always Be</h2>
          <p>These are the core values we build everything around:</p>
          <ul>
            <li><strong>Calm-first.</strong> We design for peace of mind, not panic scrolling. Your feed shows what people shared — nothing more.</li>
            <li><strong>No engagement algorithms.</strong> Posts are shown in order. We don't manipulate what you see based on what will keep you hooked.</li>
            <li><strong>No public metrics pressure.</strong> You won't see like counts, follower counts, or anything designed to make you compare yourself to others.</li>
            <li><strong>Privacy-respecting by default.</strong> Your settings start private. We believe in opt-in sharing, not opt-out protection.</li>
          </ul>
        </section>

        {/* What Pryde Will Never Do */}
        <section className="legal-section">
          <h2>🚫 What Pryde Will Never Do</h2>
          <p>Some things are off the table. Permanently.</p>
          <ul>
            <li><strong>No selling user data.</strong> Your information stays between you and us. We don't sell it, rent it, or trade it.</li>
            <li><strong>No hidden ranking systems.</strong> There's no secret algorithm deciding who "wins" visibility. Everyone's content is treated the same.</li>
            <li><strong>No shadow moderation.</strong> If we take action on content, you'll know. We don't quietly suppress things behind your back.</li>
            <li><strong>No surprise monetization.</strong> We won't suddenly paywall features you already use. If our business model changes, you'll hear about it first.</li>
          </ul>
        </section>

        {/* User Guarantees */}
        <section className="legal-section">
          <h2>🤝 Your Guarantees as a Member</h2>
          <p>When you use Pryde, here's what you can count on:</p>
          <ul>
            <li><strong>You control your data.</strong> Export it, delete it, or just keep it. It's yours.</li>
            <li><strong>You can leave at any time.</strong> Account deletion is real, not a fake button. When you leave, your data leaves too.</li>
            <li><strong>Your content is not boosted or buried.</strong> What you post appears as you posted it, where it belongs, without algorithmic intervention.</li>
            <li><strong>Your privacy settings are respected.</strong> If you say something is private, it stays private. We don't nudge you to share more.</li>
          </ul>
        </section>

        {/* Why This Matters */}
        <section className="legal-section">
          <h2>💜 Why This Matters</h2>
          <p>Most platforms make promises they break as soon as growth becomes more important than people.</p>
          <p>We wrote this page to hold ourselves accountable — and to show you that Pryde is different by design, not just by accident.</p>
          <p>If we ever break these promises, you'll have every right to call us out. That's how it should be.</p>
        </section>

        {/* Link to Feature Lock */}
        <section className="legal-section">
          <h2>📌 What We Don't Do</h2>
          <p>Some features exist on other platforms that we've intentionally removed or never built.</p>
          <p>These aren't coming back. Not because we can't — but because they don't belong here.</p>
          <ul>
            <li>Public follower/following counts</li>
            <li>Algorithmic content ranking</li>
            <li>Trending topics or hashtag virality</li>
            <li>Repost/share mechanics that amplify reach</li>
            <li>Public engagement metrics (likes, views)</li>
          </ul>
          <p>For a full list of removed features and our commitment to keeping them removed, see our development documentation.</p>
        </section>
      </div>
    </div>
  );
}

export default PlatformGuarantees;

