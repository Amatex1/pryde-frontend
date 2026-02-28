/**
 * Feed Page — Render Smoke Test Documentation
 *
 * Verifies that the Feed page and its extracted subcomponents can be
 * imported without errors and export the expected shapes.
 *
 * Automated render tests (requiring React + jsdom) are documented below.
 * To enable: npm install -D vitest @testing-library/react jsdom
 * and add "test:unit": "vitest run" to package.json scripts.
 */

/*
AUTOMATED TEST PLAN (vitest + @testing-library/react)
=====================================================

TEST: Feed renders without crashing
-------------------------------------
1. Wrap Feed in necessary providers:
   - <MemoryRouter><AuthProvider><SocketProvider><Feed /></SocketProvider></AuthProvider></MemoryRouter>
2. Mock all API calls (api.get /posts, /blocks, /friends, /bookmarks, /privacy/settings)
3. Assert: document.querySelector('.feed-page') is in the DOM
4. Assert: document.querySelector('.feed-tabs') is in the DOM

TEST: FeedList renders skeleton when loading
--------------------------------------------
1. Render <FeedList posts={[]} fetchingPosts={true} hasMore={false} ... />
   (pass stub handlers for all callbacks)
2. Assert: PostSkeleton renders (data-testid="post-skeleton" or class .post-skeleton)

TEST: FeedList renders empty state
------------------------------------
1. Render <FeedList posts={[]} fetchingPosts={false} hasMore={false} quietMode={false} ... />
2. Assert: '.empty-state' is in the DOM
3. Assert: text includes "nothing new right now"

TEST: FeedList renders posts
-------------------------------
1. Render <FeedList posts={[mockPost]} fetchingPosts={false} blockedUsers={[]} ... />
2. Assert: FeedPost is rendered (key === mockPost._id)

TEST: FeedSidebar renders explore links
-----------------------------------------
1. Render <FeedSidebar showMobileSidebar={false} />
   (wrap in MemoryRouter for Link components)
2. Assert: "Explore Pryde" heading exists
3. Assert: links to /groups, /journal, /lounge exist

TEST: useFeedPosts hook initialises correctly
---------------------------------------------
1. Render a test component that calls useFeedPosts()
2. Mock api.get('/posts') to return []
3. Assert initial state: posts=[], fetchingPosts=true (no cache), hasMore=true
4. After effect runs: fetchingPosts=false, posts=[]
*/

/**
 * Module structure smoke check — runs without DOM.
 * Verifies the new components and hook export what they should.
 */
export async function runFeedSmokeCheck() {
  const results = { passed: 0, failed: 0 };

  const assert = (condition, msg) => {
    if (!condition) {
      results.failed++;
      console.error(`  FAIL: ${msg}`);
      return false;
    }
    results.passed++;
    console.log(`  PASS: ${msg}`);
    return true;
  };

  console.log('[Feed Smoke Check]');

  // FeedSidebar
  try {
    const mod = await import('../../components/feed/FeedSidebar.jsx');
    assert(typeof (mod.default || mod.FeedSidebar) === 'function',
      'FeedSidebar is a function component');
  } catch (err) {
    results.failed++;
    console.error('  FAIL: FeedSidebar import threw:', err.message);
  }

  // FeedList
  try {
    const mod = await import('../../components/feed/FeedList.jsx');
    assert(typeof (mod.default || mod.FeedList) === 'function',
      'FeedList is a function component');
  } catch (err) {
    results.failed++;
    console.error('  FAIL: FeedList import threw:', err.message);
  }

  // useFeedPosts hook
  try {
    const mod = await import('../../hooks/useFeedPosts.js');
    assert(typeof mod.useFeedPosts === 'function',
      'useFeedPosts is exported as a named function');
  } catch (err) {
    results.failed++;
    console.error('  FAIL: useFeedPosts import threw:', err.message);
  }

  console.log(`\nResults: ${results.passed} passed, ${results.failed} failed`);
  return results;
}

export default { runFeedSmokeCheck };
