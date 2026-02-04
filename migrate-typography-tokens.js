#!/usr/bin/env node

/**
 * Typography Token Migration Script
 * ==================================
 * Automatically replaces magic number font-sizes, font-weights, and line-heights
 * with consolidated typography tokens from typography-tokens.css
 *
 * Usage: node migrate-typography-tokens.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to migrate
const FILES_TO_MIGRATE = [
  'src/pages/Admin.css',
  'src/pages/Groups.css',
  'src/pages/Navbar.css',
  'src/pages/Feed.calm.css',
  'src/pages/Settings.css',
  'src/pages/Lounge.css',
  'src/pages/GroupsList.css',
];

// Replacement mappings
const REPLACEMENTS = {
  // Font weights
  'font-weight: 400': 'font-weight: var(--font-weight-normal)',
  'font-weight: 500': 'font-weight: var(--font-weight-medium)',
  'font-weight: 600': 'font-weight: var(--font-weight-semibold)',
  'font-weight: 700': 'font-weight: var(--font-weight-bold)',
  'font-weight: 900': 'font-weight: var(--font-weight-bold)', // Map 900 to bold
  
  // Line heights (common values)
  'line-height: 1;': 'line-height: var(--line-height-tight);',
  'line-height: 1.2;': 'line-height: var(--line-height-tight);',
  'line-height: 1.25;': 'line-height: var(--line-height-tight);',
  'line-height: 1.3;': 'line-height: var(--line-height-tight);',
  'line-height: 1.4;': 'line-height: var(--line-height-normal);',
  'line-height: 1.45;': 'line-height: var(--line-height-normal);',
  'line-height: 1.5;': 'line-height: var(--line-height-normal);',
  'line-height: 1.55;': 'line-height: var(--line-height-normal);',
  'line-height: 1.6;': 'line-height: var(--line-height-relaxed);',
  'line-height: 1.65;': 'line-height: var(--line-height-relaxed);',
  'line-height: 1.8;': 'line-height: var(--line-height-relaxed);',
  
  // Line heights with !important
  'line-height: 1 !important': 'line-height: var(--line-height-tight) !important',
  'line-height: 1.2 !important': 'line-height: var(--line-height-tight) !important',
  'line-height: 1.5 !important': 'line-height: var(--line-height-normal) !important',
  'line-height: 1.6 !important': 'line-height: var(--line-height-relaxed) !important',
  
  // Line heights without semicolon (for multiline detection)
  'line-height: 0': 'line-height: var(--line-height-tight)',
};

// Statistics
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
  replacementsByType: {},
};

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let fileReplacements = 0;
  
  // Apply replacements
  for (const [oldValue, newValue] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = (content.match(regex) || []).length;
    
    if (matches > 0) {
      content = content.replace(regex, newValue);
      fileReplacements += matches;
      
      // Track by type
      const type = oldValue.split(':')[0];
      stats.replacementsByType[type] = (stats.replacementsByType[type] || 0) + matches;
    }
  }
  
  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${fileReplacements} replacements`);
    stats.filesModified++;
    stats.totalReplacements += fileReplacements;
  } else {
    console.log(`⏭️  ${filePath}: No changes needed`);
  }
  
  stats.filesProcessed++;
}

// Main execution
console.log('🚀 Typography Token Migration Script');
console.log('=====================================\n');

FILES_TO_MIGRATE.forEach(migrateFile);

console.log('\n📊 Migration Summary');
console.log('====================');
console.log(`Files processed: ${stats.filesProcessed}`);
console.log(`Files modified: ${stats.filesModified}`);
console.log(`Total replacements: ${stats.totalReplacements}`);
console.log('\nReplacements by type:');
Object.entries(stats.replacementsByType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

console.log('\n✨ Migration complete!');
console.log('\n⚠️  IMPORTANT: Review changes before committing');
console.log('Run: git diff src/pages/');

