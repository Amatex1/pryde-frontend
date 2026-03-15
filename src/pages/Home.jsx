import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../utils/auth';
import Footer from '../components/Footer';
import WhatYoullFind from '../components/WhatYoullFind';
import './Home.css';

function Home() {
  const isAuth = isAuthenticated();

  // Apply Galaxy layer on homepage only if user hasn't explicitly disabled it
  // Respects user's saved preference — galaxy is the default but not forced on those who opted out
  useEffect(() => {
    const savedGalaxy = localStorage.getItem('galaxyMode');
    if (savedGalaxy === 'false') return; // User explicitly disabled galaxy — respect their choice

    const wasGalaxy = document.documentElement.getAttribute('data-galaxy') === 'true';
    document.documentElement.setAttribute('data-galaxy', 'true');

    return () => {
      if (!wasGalaxy) {
        document.documentElement.removeAttribute('data-galaxy');
      }
    };
  }, []);

  return (
    <>
      <div className="home-root">

        {/* ── HERO ── */}
        <section className="home-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-content">
            <p className="hero-eyebrow">A quiet online café for conversations that matter.</p>
            <h1 className="hero-title">
              Not everything needs<br />to be loud.
            </h1>
            <p className="hero-sub">
              Pryde is a calmer social space for people who want real connection
              — without algorithms, clout chasing, or the pressure to perform.
            </p>

            <div className="hero-actions">
              {isAuth ? (
                <>
                  <Link to="/feed" className="btn-hero-primary">Go to Feed</Link>
                  <Link to="/groups" className="btn-hero-secondary">Explore Groups</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-hero-primary">Join Pryde</Link>
                  <Link to="/login" className="btn-hero-secondary">Sign In</Link>
                </>
              )}
            </div>

            <p className="hero-meta">18+ only · LGBTQ+ owned · No ads · No engagement metrics</p>
          </div>
        </section>

        {/* ── WHY PRYDE ── */}
        <section className="home-why">
          <div className="container">
            <h2 className="section-heading">Why Pryde Exists</h2>
            <p className="section-sub">
              We built this because we were tired of platforms that reward outrage and comparison.
              Here, you're not a number.
            </p>

            <div className="why-cards">
              <div className="why-card">
                <span className="why-card-icon" aria-hidden="true">🌿</span>
                <h3>No algorithms</h3>
                <p>Your feed is chronological and calm. No ranking, no rage-bait, no endless scroll engineered to keep you hooked.</p>
              </div>

              <div className="why-card">
                <span className="why-card-icon" aria-hidden="true">🔒</span>
                <h3>Private by default</h3>
                <p>Spaces that are actually yours. Groups can be closed, posts can be limited, and you control who sees what.</p>
              </div>

              <div className="why-card">
                <span className="why-card-icon" aria-hidden="true">💜</span>
                <h3>Queer-centred care</h3>
                <p>Moderated by real humans who understand the community, not bots applying one-size-fits-all rules.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT YOU'LL FIND HERE ── */}
        <WhatYoullFind />

        {/* ── TRUST STRIP ── */}
        <section className="home-trust">
          <div className="trust-inner">
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">🚫</span>
              <span>No ads</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">🍪</span>
              <span>No tracking cookies</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">🧑‍💻</span>
              <span>Human moderation</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">🌈</span>
              <span>Community-first</span>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="home-final-cta">
          <div className="container">
            <h2 className="final-cta-heading">
              You belong here,<br />exactly as you are.
            </h2>
            <p className="final-cta-sub">
              Join thousands of queer adults building something quieter, kinder, and more real.
            </p>
            {isAuth ? (
              <Link to="/feed" className="btn-hero-primary">Go to Feed</Link>
            ) : (
              <Link to="/register" className="btn-hero-primary">Join Pryde</Link>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Home;
