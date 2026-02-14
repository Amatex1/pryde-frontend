import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../utils/auth';
import Footer from '../components/Footer';
import './Home.css';

function Home() {
  const isAuth = isAuthenticated();

  // Apply Galaxy theme on homepage only
  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute('data-theme');
    const previousColorMode = document.documentElement.getAttribute('data-color-mode');
    document.documentElement.setAttribute('data-theme', 'galaxy');
    // Preserve light/dark preference as data-color-mode
    if (!previousColorMode) {
      const colorMode = previousTheme === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-color-mode', colorMode);
    }

    return () => {
      if (previousTheme && previousTheme !== 'galaxy') {
        document.documentElement.setAttribute('data-theme', previousTheme);
        document.documentElement.removeAttribute('data-color-mode');
      } else if (previousTheme === 'galaxy') {
        // Was already in galaxy mode (user has it enabled globally)
        document.documentElement.setAttribute('data-theme', 'galaxy');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-color-mode');
      }
    };
  }, []);

  return (
    <>
      <div className="home-root">
        {/* STEP 1: Hero Section */}
        <section className="home-hero">
          <div className="hero-content">
            <h1 className="hero-title">Not everything needs to be loud.</h1>

            <p className="hero-sub">
              Pryde is a calmer, queer-centred social space for adults who want connection
              without algorithms, clout, or pressure.
            </p>

            <div className="hero-actions">
              {isAuth ? (
                <>
                  <Link to="/feed" className="primary-button">
                    Go to Feed
                  </Link>
                  <Link to="/groups" className="btn-secondary">
                    Explore Groups
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="primary-button">
                    Join as a Founding Member
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    Sign In
                  </Link>
                  <Link to="/groups" className="btn-secondary">
                    Explore the Space
                  </Link>
                </>
              )}
            </div>

            <div className="hero-meta">
              18+ only • LGBTQ+ owned • No ads • No engagement metrics
            </div>
          </div>
        </section>

        {/* STEP 2: Why Pryde Exists Section */}
        <section className="home-why">
          <div className="container">
            <div className="why-grid">
              <div className="why-text">
                <h2>Why Pryde Exists</h2>
                <p>
                  Pryde started because many of us felt exhausted by platforms that
                  reward outrage, comparison, and performative posts over authenticity.
                  We wanted a simpler, safer place where we could be real without
                  pressure to chase numbers.
                </p>
              </div>

              <div className="why-preview">
                <div className="glass-card mock-post-card">
                  <h3>Today's Reflections</h3>
                  <p>
                    Sometimes you just need to breathe. Step back. Turn off the noise.
                    Reconnect with yourself.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3: Experience Section */}
        <section className="home-experience">
          <div className="container">
            <h2>When you join Pryde, you can:</h2>

            <div className="experience-grid">
              <div className="glass-card experience-card">
                <h3>Post without pressure</h3>
                <p>Share thoughts without public metrics or algorithm ranking.</p>
              </div>

              <div className="glass-card experience-card">
                <h3>Join private queer groups</h3>
                <p>Find smaller spaces for creativity, support, and real talk.</p>
              </div>

              <div className="glass-card experience-card">
                <h3>Write long reflections</h3>
                <p>Express yourself without your words being buried.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 4: Community Preview Section */}
        <section className="home-community">
          <div className="container">
            <h2>Step into a calmer queer community…</h2>

            <div className="community-grid">
              <div className="glass-card community-card">Deep Thoughts</div>
              <div className="glass-card community-card">Creative Hub</div>
              <div className="glass-card community-card">Introverts Lounge</div>
            </div>
          </div>
        </section>

        {/* STEP 5: Final CTA Section */}
        <section className="home-final-cta">
          <div className="container">
            <h2>Step into something calmer.</h2>
            {isAuth ? (
              <Link to="/feed" className="primary-button large">
                Go to Feed
              </Link>
            ) : (
              <Link to="/register" className="primary-button large">
                Create Your Profile
              </Link>
            )}
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

export default Home;

