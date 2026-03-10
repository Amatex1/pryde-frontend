import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/pages/Messages.css'), 'utf8');

describe('Messages desktop layout CSS', () => {
  it('keeps the legacy desktop composer visible inside the fixed /messages shell', () => {
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-area,\s*[\s\S]*?\.messages-page \.chat-messages\s*\{[\s\S]*?min-height:\s*0\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-area\s*\{[\s\S]*?overflow:\s*hidden\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-messages\s*\{[\s\S]*?flex:\s*1 1 auto\s*!important;[\s\S]*?height:\s*auto\s*!important;/);
    expect(styles).toMatch(/@media\s*\(min-width:\s*1025px\)\s*\{[\s\S]*?\.messages-page \.chat-input-area\s*\{[\s\S]*?flex-shrink:\s*0\s*!important;/);
  });
});