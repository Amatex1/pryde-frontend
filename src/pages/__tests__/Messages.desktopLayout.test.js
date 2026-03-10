import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/pages/Messages.css'), 'utf8');

describe('Messages desktop layout CSS', () => {
  it('rebuilds the legacy desktop shell into a stable grid and keeps the composer in normal flow', () => {
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page > \.messages-container\s*\{[\s\S]*?display:\s*flex\s*!important;[\s\S]*?min-height:\s*0\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.messages-layout\s*\{[\s\S]*?display:\s*grid\s*!important;[\s\S]*?grid-template-columns:\s*300px minmax\(0,\s*1fr\)\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-area\s*\{[\s\S]*?grid-column:\s*2\s*!important;[\s\S]*?min-height:\s*0\s*!important;[\s\S]*?overflow:\s*hidden\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-input-area\s*\{[\s\S]*?position:\s*relative\s*!important;[\s\S]*?bottom:\s*auto\s*!important;[\s\S]*?flex-shrink:\s*0\s*!important;/);
  });

  it('keeps the desktop conversation lane centered instead of squeezing it left', () => {
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-messages\s*\{[\s\S]*?flex:\s*1 1 auto\s*!important;[\s\S]*?height:\s*auto\s*!important;[\s\S]*?padding-left:\s*clamp\(16px,\s*2vw,\s*24px\)\s*!important;[\s\S]*?padding-right:\s*clamp\(16px,\s*2vw,\s*24px\)\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.conversation-inner\s*\{[\s\S]*?max-width:\s*880px\s*!important;[\s\S]*?margin:\s*0 auto\s*!important;/);
  });

  it('restores the third desktop column only on wide screens', () => {
    expect(styles).toMatch(/@media\s*\(min-width:\s*1280px\)\s*\{[\s\S]*?\.messages-page \.messages-layout\s*\{[\s\S]*?grid-template-columns:\s*300px minmax\(0,\s*1fr\) 320px\s*!important;/);
  });
});