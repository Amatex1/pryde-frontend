import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/pages/Messages.css'), 'utf8');

describe('Messages desktop layout CSS', () => {
  it('keeps Messages inside the shared shell instead of overriding root or body layout', () => {
    expect(styles).not.toMatch(/#root:has\(\.messages-page\)/);
    expect(styles).not.toMatch(/body:has\(\.messages-page\)/);
    expect(styles).not.toMatch(/\.messages-page\s*\{[^}]*position:\s*fixed\s*!important;/);
  });

  it('uses the page-owned grid contract for desktop and tablet widths', () => {
    expect(styles).toMatch(/\.messages-page\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*300px minmax\(0,\s*1fr\) 320px;[\s\S]*?grid-template-rows:\s*auto 1fr;[\s\S]*?min-height:\s*100dvh;/);
    expect(styles).toMatch(/\.messages-container\s*\{[\s\S]*?display:\s*contents;/);
    expect(styles).toMatch(/\.messages-layout\s*\{[\s\S]*?display:\s*contents;/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*1279px\)\s*\{[\s\S]*?\.messages-info\s*\{[\s\S]*?display:\s*none;/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*?\.messages-page\s*\{[\s\S]*?grid-template-columns:\s*300px 1fr;/);
  });

  it('collapses to a single-pane mobile flow based on the in-conversation state', () => {
    expect(styles).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\.messages-page\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?overflow-x:\s*hidden;/);
    expect(styles).toMatch(/\.messages-page:not\(\.in-conversation\) \.conversations-sidebar\s*\{[\s\S]*?display:\s*flex\s*!important;/);
    expect(styles).toMatch(/\.messages-page\.in-conversation \.conversations-sidebar\s*\{[\s\S]*?display:\s*none\s*!important;/);
    expect(styles).toMatch(/\.messages-page\.in-conversation \.chat-area[\s\S]*?display:\s*flex\s*!important;/);
  });
});