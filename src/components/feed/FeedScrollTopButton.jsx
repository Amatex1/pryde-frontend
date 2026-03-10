export default function FeedScrollTopButton({ visible, onClick }) {
  return (
    <button
      className={`scroll-to-top-btn glossy floating-layer ${visible ? 'visible' : 'hidden'}`}
      onClick={onClick}
      aria-label="Scroll to top"
      aria-hidden={!visible}
      type="button"
    >
      ⬆️
    </button>
  );
}