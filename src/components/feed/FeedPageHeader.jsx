import Navbar from '../Navbar';
import PasskeyBanner from '../PasskeyBanner';
import EmailVerificationBanner from '../EmailVerificationBanner';
import PageTitle from '../PageTitle';

export default function FeedPageHeader({ onMenuOpen }) {
  return (
    <>
      <Navbar onMenuClick={onMenuOpen} />
      <EmailVerificationBanner />
      <PasskeyBanner />
      <PageTitle
        title="Feed"
        subtitle="Updates from people and spaces you follow."
        pageKey="feed"
        firstVisitOnly
      />
    </>
  );
}