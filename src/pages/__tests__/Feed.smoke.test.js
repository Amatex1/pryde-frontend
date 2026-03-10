import { describe, expect, it } from 'vitest';

describe('feed module smoke tests', () => {
  it('exports the extracted feed components and hook', async () => {
    const [sidebar, list, commentSurfaces, hook] = await Promise.all([
      import('../../components/feed/FeedSidebar.jsx'),
      import('../../components/feed/FeedList.jsx'),
      import('../../components/feed/FeedCommentSurfaces.jsx'),
      import('../../hooks/useFeedPosts.js'),
    ]);

    expect(typeof sidebar.default).toBe('function');
    expect(typeof list.default).toBe('function');
    expect(typeof commentSurfaces.default).toBe('function');
    expect(typeof hook.useFeedPosts).toBe('function');
  });
});
