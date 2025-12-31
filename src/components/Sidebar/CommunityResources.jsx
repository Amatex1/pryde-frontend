/**
 * Community & Resources Sidebar Section
 * 
 * Static, curated LGBTQ+ news, culture, and support links.
 * - No fetching, no auto-refresh
 * - No headlines or timestamps
 * - No interaction beyond link clicks
 * - Calm, optional presence
 */

import './CommunityResources.css';

// Static curated links - no API calls
const LGBTQ_NEWS_CULTURE = [
  { name: 'LGBTQ Nation', url: 'https://www.lgbtqnation.com/' },
  { name: 'The Advocate', url: 'https://www.advocate.com/' },
  { name: 'PinkNews', url: 'https://www.thepinknews.com/' },
  { name: 'Queerty', url: 'https://www.queerty.com/' },
  { name: 'GAY TIMES', url: 'https://www.gaytimes.co.uk/' },
  { name: 'Out Magazine', url: 'https://www.out.com/' },
  { name: 'QNews', url: 'https://qnews.com.au/' },
];

const SUPPORT_ADVOCACY = [
  { name: 'The Trevor Project', url: 'https://www.thetrevorproject.org/' },
  { name: 'Human Rights Campaign', url: 'https://www.hrc.org/' },
  { name: 'LGBT Foundation', url: 'https://lgbt.foundation/' },
  { name: 'PFLAG', url: 'https://pflag.org/' },
  { name: 'ILGA World', url: 'https://ilga.org/' },
  { name: 'MindOut', url: 'https://mindout.org.uk/' },
];

function CommunityResources() {
  return (
    <aside className="community-resources" aria-label="Community and Resources">
      <h3 className="community-resources-title">Community & Resources</h3>
      <p className="community-resources-intro">
        Curated LGBTQ+ voices, support, and culture.
      </p>

      <nav aria-label="LGBTQ+ News and Culture">
        <h4 className="community-resources-section-title">News & Culture</h4>
        <ul className="community-resources-list">
          {LGBTQ_NEWS_CULTURE.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.name} (opens in new tab)`}
                className="community-resources-link"
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Support and Advocacy Organizations">
        <h4 className="community-resources-section-title">Support & Advocacy</h4>
        <ul className="community-resources-list">
          {SUPPORT_ADVOCACY.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.name} (opens in new tab)`}
                className="community-resources-link"
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default CommunityResources;

