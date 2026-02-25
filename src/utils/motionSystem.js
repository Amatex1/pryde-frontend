/**
 * PRYDE MOTION SYSTEM v1 — Feed Stagger Engine
 *
 * Implements IntersectionObserver-based stagger entry for feed post cards.
 * Self-initialising: call initMotionSystem() once at app boot (main.jsx).
 *
 * Performance contract:
 *   - Zero scroll event listeners
 *   - Zero DOM measurement loops
 *   - IntersectionObserver + MutationObserver only
 *   - GPU-accelerated via CSS transform + opacity (defined in motion.css)
 *   - will-change released after animation completes
 *   - prefers-reduced-motion aware
 *
 * How stagger works:
 *   1. .post-card.fade-in elements start at { opacity:0, translateY(8px) }
 *      (defined in motion.css — only affects .post-card.fade-in, not other .fade-in usages)
 *   2. IntersectionObserver adds .is-entered when each card enters viewport
 *   3. CSS transitions the card to { opacity:1, translateY(0) }
 *   4. Stagger delay: each item in a simultaneous batch gets +40ms delay
 *      via --stagger-delay CSS custom property
 *   5. observer.unobserve() called immediately — no re-animation on scroll-back
 *   6. MutationObserver watches for new .post-card elements (infinite scroll)
 */

const STAGGER_STEP_MS = 40;      // Delay between items in same viewport batch
const ANIMATION_DURATION_MS = 160; // Must match --duration-standard in motion.css
const WILL_CHANGE_TTL_MS = 80;    // Extra grace after animation ends before releasing layer

const POST_SELECTOR = '.post-card.fade-in';

let _intersectionObserver = null;
let _mutationObserver = null;
let _initialised = false;

/** Returns true if the user prefers reduced motion */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Mark a batch of cards as entered.
 * Each card in the batch gets an incrementing stagger delay.
 * @param {Element[]} cards - Cards visible in this IntersectionObserver batch
 */
function enterCards(cards) {
  const reduced = prefersReducedMotion();

  cards.forEach((el, batchIndex) => {
    if (el.classList.contains('is-entered')) return; // already processed

    if (!reduced) {
      // Set stagger delay as a CSS custom property on the element itself
      el.style.setProperty('--stagger-delay', `${batchIndex * STAGGER_STEP_MS}ms`);
    }

    // Trigger the CSS transition defined in motion.css
    el.classList.add('is-entered');

    // Release GPU compositing layer after animation + stagger delay finishes
    const releaseDelay = reduced
      ? 0
      : ANIMATION_DURATION_MS + batchIndex * STAGGER_STEP_MS + WILL_CHANGE_TTL_MS;

    setTimeout(() => el.classList.add('motion-done'), releaseDelay);
  });
}

/**
 * Register elements with the IntersectionObserver.
 * Skips elements already processed.
 * @param {Element[]|NodeList} elements
 */
function observeCards(elements) {
  if (!_intersectionObserver) return;

  for (const el of elements) {
    if (!el.classList.contains('is-entered')) {
      _intersectionObserver.observe(el);
    }
  }
}

/**
 * Initialise the Pryde Motion System.
 * Safe to call multiple times — only runs once.
 * Call after ReactDOM.createRoot().render() in main.jsx.
 *
 * @returns {() => void} cleanup function (optional — useful in tests)
 */
export function initMotionSystem() {
  if (_initialised || typeof window === 'undefined') return () => {};
  _initialised = true;

  // ── IntersectionObserver: triggers stagger entry ─────────────────
  _intersectionObserver = new IntersectionObserver(
    (entries) => {
      // Collect all cards entering the viewport in this callback batch
      const entering = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target);

      if (entering.length === 0) return;

      // Unobserve immediately — one-shot per element, no re-animation
      entering.forEach((el) => _intersectionObserver.unobserve(el));

      // Apply stagger (reduced-motion: instant)
      enterCards(entering);
    },
    {
      threshold: 0.05,          // Trigger as soon as 5% of card is visible
      rootMargin: '0px 0px -20px 0px', // Small bottom margin avoids premature trigger
    }
  );

  // ── Seed: observe post cards already in the DOM at boot ──────────
  observeCards(document.querySelectorAll(POST_SELECTOR));

  // ── MutationObserver: catch post cards added via infinite scroll ──
  _mutationObserver = new MutationObserver((mutations) => {
    const newCards = [];

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue; // Element nodes only

        // Direct match (FeedPost root element)
        if (
          node.classList?.contains('post-card') &&
          node.classList?.contains('fade-in')
        ) {
          newCards.push(node);
        }

        // Descendant match (post card inside a newly-added wrapper)
        const nested = node.querySelectorAll?.(POST_SELECTOR);
        if (nested?.length) {
          newCards.push(...nested);
        }
      }
    }

    if (newCards.length > 0) {
      observeCards(newCards);
    }
  });

  _mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Return cleanup for testing or HMR scenarios
  return () => {
    _intersectionObserver?.disconnect();
    _mutationObserver?.disconnect();
    _intersectionObserver = null;
    _mutationObserver = null;
    _initialised = false;
  };
}
