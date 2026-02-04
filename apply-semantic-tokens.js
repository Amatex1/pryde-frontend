#!/usr/bin/env node

/**
 * Semantic Typography Token Application Script
 * =============================================
 * Replaces generic typography tokens with component-specific semantic tokens
 * 
 * Usage: node apply-semantic-tokens.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process
const FILES_TO_MIGRATE = [
  'src/pages/Profile.css',
  'src/pages/Feed.calm.css',
  'src/pages/Feed.css',
  'src/pages/Admin.css',
  'src/pages/Groups.css',
  'src/pages/Settings.css',
  'src/pages/Lounge.css',
  'src/pages/GroupsList.css',
];

// Simple line-by-line replacements for semantic tokens
// These are context-aware: only replace when the selector matches
const REPLACEMENTS = {
  // Post content - only in .post-content rules
  'post-content-font': {
    selector: '.post-content',
    from: 'font-size: var(--font-size-base)',
    to: 'font-size: var(--post-font-size)'
  },
  'post-content-line': {
    selector: '.post-content',
    from: 'line-height: var(--line-height-relaxed)',
    to: 'line-height: var(--post-line-height)'
  },

  // Comment text - only in .comment-text rules
  'comment-font-sm': {
    selector: '.comment-text',
    from: 'font-size: var(--font-size-sm)',
    to: 'font-size: var(--comment-font-size)'
  },
  'comment-font-base': {
    selector: '.comment-text',
    from: 'font-size: var(--font-size-base)',
    to: 'font-size: var(--comment-font-size)'
  },
  'comment-line': {
    selector: '.comment-text',
    from: 'line-height: var(--line-height-normal)',
    to: 'line-height: var(--comment-line-height)'
  },
};

// Statistics
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
  replacementsByType: {},
};

function applySemanticTokens(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let fileReplacements = 0;

  // Track which selector we're currently in
  let lines = content.split('\n');
  let currentSelector = '';
  let inRule = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track selector context
    if (line.includes('{') && !line.trim().startsWith('/*')) {
      // Extract selector (everything before {)
      const selectorMatch = line.match(/([^{]+)\{/);
      if (selectorMatch) {
        currentSelector = selectorMatch[1].trim();
        inRule = true;
      }
    }

    if (line.includes('}')) {
      inRule = false;
      currentSelector = '';
    }

    // Apply replacements if we're in the right selector context
    if (inRule && currentSelector) {
      for (const [key, rule] of Object.entries(REPLACEMENTS)) {
        if (currentSelector.includes(rule.selector) && line.includes(rule.from)) {
          lines[i] = line.replace(rule.from, rule.to);
          fileReplacements++;
          stats.replacementsByType[key] = (stats.replacementsByType[key] || 0) + 1;
        }
      }
    }
  }

  content = lines.join('\n');

  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${fileReplacements} semantic token applications`);
    stats.filesModified++;
    stats.totalReplacements += fileReplacements;
  } else {
    console.log(`⏭️  ${filePath}: No semantic tokens to apply`);
  }

  stats.filesProcessed++;
}

// Main execution
console.log('🎯 Semantic Typography Token Application');
console.log('=========================================\n');

FILES_TO_MIGRATE.forEach(applySemanticTokens);

console.log('\n📊 Application Summary');
console.log('======================');
console.log(`Files processed: ${stats.filesProcessed}`);
console.log(`Files modified: ${stats.filesModified}`);
console.log(`Total semantic token applications: ${stats.totalReplacements}`);

console.log('\n✨ Semantic token application complete!');
console.log('\n⚠️  IMPORTANT: Review changes before committing');
console.log('Run: git diff src/pages/');

