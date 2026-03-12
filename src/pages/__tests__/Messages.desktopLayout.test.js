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

  it('uses flex-based desktop layout with sidebar, chat area, and info panel columns', () => {
    // .messages-page is a flex column container
    expect(styles).toMatch(/\.messages-page\s*\{[\s\S]*?display:\s*flex;/);
    expect(styles).toMatch(/\.messages-page\s*\{[\s\S]*?flex-direction:\s*column;/);
    // inner layout containers use flex
    expect(styles).toMatch(/\.messages-container\s*\{[\s\S]*?display:\s*flex;/);
    expect(styles).toMatch(/\.messages-layout\s*\{[\s\S]*?display:\s*flex;/);
    // info panel hidden on tablet
    expect(styles).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*?\.messages-info\s*\{[\s\S]*?display:\s*none;/);
  });

  it('collapses to a single-pane mobile flow based on the in-conversation state', () => {
    // mobile media query exists
    expect(styles).toMatch(/@media\s*\(max-width:\s*768px\)/);
    // sidebar slides off-screen when in a conversation
    expect(styles).toMatch(/\.messages-page\.in-conversation\s+\.conversations-sidebar\s*\{[\s\S]*?transform:\s*translateX\(-100%\)/);
    // chat area slides into view when in a conversation
    expect(styles).toMatch(/\.messages-page\.in-conversation\s+\.chat-area\s*\{[\s\S]*?transform:\s*translateX\(0\)/);
  });
});