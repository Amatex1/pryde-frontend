import { describe, expect, it } from 'vitest';

describe('profile module smoke tests', () => {
  it('exports the extracted profile decomposition components', async () => {
    const [ownRail, tabs, panels] = await Promise.all([
      import('../../components/profile/ProfileOwnRail.jsx'),
      import('../../components/profile/ProfileTabs.jsx'),
      import('../../components/profile/ProfileLibraryPanels.jsx'),
    ]);

    expect(typeof ownRail.default).toBe('function');
    expect(typeof tabs.default).toBe('function');
    expect(typeof panels.default).toBe('function');
  });
});