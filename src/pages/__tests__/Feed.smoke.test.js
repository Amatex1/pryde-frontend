import { describe, expect, it } from 'vitest';

describe('feed module smoke tests', () => {
  it('exports the extracted feed components and hook', async () => {
    const [sidebar, list, hook] = await Promise.all([
      import('../../components/feed/FeedSidebar.jsx'),
      import('../../components/feed/FeedList.jsx'),
      import('../../hooks/useFeedPosts.js'),
    ]);

    expect(typeof sidebar.default).toBe('function');
    expect(typeof list.default).toBe('function');
    expect(typeof hook.useFeedPosts).toBe('function');
  });
});
