import './WhatYoullFind.css';

const cards = [
  {
    icon: '💬',
    title: 'Real Conversations',
    body: 'Authentic posts. Honest feelings. Shared experiences.',
  },
  {
    icon: '🛡️',
    title: 'Protected Identity',
    body: 'Identity-based harm is not tolerated. Moderation protects the space.',
  },
  {
    icon: '🌈',
    title: 'Shared Pride',
    body: 'Celebrate wins, growth, and everyday moments that matter.',
  },
];

function WhatYoullFind() {
  return (
    <section className="wyf-section">
      <div className="wyf-container">
        <h2 className="wyf-heading">What You'll Find Here</h2>
        <p className="wyf-sub">
          A space shaped around the people in it — not around engagement numbers.
        </p>

        <div className="wyf-grid">
          {cards.map(({ icon, title, body }) => (
            <div className="wyf-card" key={title}>
              <span className="wyf-icon" aria-hidden="true">{icon}</span>
              <h3 className="wyf-card-title">{title}</h3>
              <p className="wyf-card-body">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhatYoullFind;
