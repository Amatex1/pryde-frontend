import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LegalPageWrapper from './LegalPageWrapper';

describe('LegalPageWrapper', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies the saved dark theme preference for public legal pages', () => {
    localStorage.setItem('darkMode', 'true');

    render(
      <LegalPageWrapper>
        <div>Legal content</div>
      </LegalPageWrapper>
    );

    expect(screen.getByText('Legal content')).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});