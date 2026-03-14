import React from 'react'
import { Link } from 'react-router-dom'
import './legal/Legal.css'

export default function Safety() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link to="/" className="legal-home-button">
          Home
        </Link>
        <h1>Community Safety</h1>
        <p className="legal-subtitle">How Pryde keeps its community safe</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>18+ Platform</h2>
          <p>
            Pryde Social is designed for adults.
            You must be at least 18 years old to create or maintain an account.
          </p>
        </section>

        <section>
          <h2>Protecting Young People</h2>
          <p>
            Pryde actively enforces its age policy.
            Accounts suspected of belonging to users under 18 may be reviewed and removed.
          </p>
        </section>

        <section>
          <h2>Reporting Underage Accounts</h2>
          <p>
            If you believe someone is under 18, please report the account using the report feature.
          </p>
        </section>

        <section>
          <h2>Moderation &amp; Enforcement</h2>
          <p>
            Pryde uses automated detection systems and moderation tools
            to help identify accounts that violate its age policy.
          </p>
        </section>

        <section>
          <h2>More Information</h2>
          <p>
            For full details on our safety practices and moderation policies, see our{' '}
            <Link to="/safety-moderation" className="legal-link">Safety &amp; Moderation</Link> page.
          </p>
        </section>
      </div>
    </div>
  )
}
