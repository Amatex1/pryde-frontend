export default function FeedPullToRefresh({ isPulling, pullDistance }) {
  if (!isPulling) {
    return null;
  }

  return (
    <div
      className="pull-to-refresh-indicator"
      style={{
        transform: `translateY(${pullDistance}px)`,
        opacity: pullDistance / 100,
      }}
    >
      <div className="refresh-spinner">
        {pullDistance > 60 ? '🔄 Release to refresh' : '⬇️ Pull to refresh'}
      </div>
    </div>
  );
}