export default function CommunityBanner() {
  return (
    <div
      className="community-banner"
      style={{
        background: 'linear-gradient(135deg, #3b1a6b 0%, #5a2d9e 50%, #7b3fc0 100%)',
        border: '1px solid rgba(160, 100, 230, 0.45)',
        boxShadow: '0 0 14px rgba(140, 80, 220, 0.25)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '12px',
        color: '#f0e6ff',
        fontSize: '0.92rem',
        lineHeight: '1.55',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      Pryde is a protected digital community centre for LGBTQ+ people and allies.{' '}
      Be proud. Be kind. Be real. You don&apos;t have to explain yourself here.
    </div>
  );
}
