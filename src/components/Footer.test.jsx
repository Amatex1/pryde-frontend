import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer', () => {
  it('renders internal legal navigation as SPA links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const expectedLinks = [
      ['Trust Center', '/trust-center'],
      ['Platform Guarantees', '/guarantees'],
      ['Terms', '/terms'],
      ['Privacy', '/privacy'],
      ['DMCA', '/dmca'],
      ['Community Guidelines', '/community-guidelines'],
      ['Security', '/security'],
      ['FAQ', '/faq'],
      ['Contact', '/contact'],
    ];

    expectedLinks.forEach(([name, href]) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    });
  });
});