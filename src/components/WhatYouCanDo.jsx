import { Link } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import './WhatYouCanDo.css';

const features = [
  {
    icon: '💬',
    title: 'Share real conversations',
    body: 'Post thoughts, stories, and everyday moments without pressure to perform.',
  },
  {
    icon: '📸',
    title: 'Share photos and media',
    body: 'Photos and videos can be shared naturally with friends, groups, or the wider community.',
  },
  {
    icon: '👥',
    title: 'Find your people',
    body: 'Join groups and conversations with people who share your experiences and interests.',
  },
];

function WhatYouCanDo() {
  const isAuth = isAuthenticated();

  return (
    <section className="wycd-section">
      <div className="wycd-container">
        <h2 className="wycd-heading">What you can do on Pryde</h2>
        <p className="wycd-sub">
          Pryde is designed for real conversations, shared moments, and quieter online spaces.
        </p>

        <div className="wycd-grid">
          {features.map(({ icon, title, body }) => (
            <div className="wycd-card" key={title}>
              <span className="wycd-icon" aria-hidden="true">{icon}</span>
              <h3 className="wycd-card-title">{title}</h3>
              <p className="wycd-card-body">{body}</p>
            </div>
          ))}
        </div>

        <div className="wycd-screenshot-wrap">
          <p className="wycd-screenshot-label">See Pryde in action</p>
          <div className="wycd-screenshot-placeholder" role="img" aria-label="Pryde social community feed preview" />
        </div>

        <div className="wycd-cta">
          <p className="wycd-cta-text">Start sharing in minutes.</p>
          {!isAuth && (
            <Link to="/register" className="btn-hero-primary">Join Pryde</Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default WhatYouCanDo;
