#!/usr/bin/env node

/**
 * Production Code Comparison Script
 * 
 * This script compares local files with production files to identify differences.
 * 
 * Usage:
 * 1. Download production files from Vercel:
 *    - Go to https://vercel.com/mats-projects-d8392976/pryde-frontend
 *    - Click on "Deployments" tab
 *    - Find the production deployment and download the files
 *    - Extract files to a folder named "production"
 * 
 * 2. Run this script:
 *    node compare-with-production.js
 * 
 * Output:
 * - Lists all files that differ between local and production
 * - Shows the nature of differences
 */

const fs = require('fs');
const path = require('path');

const LOCAL_DIR = path.join(__dirname, 'src');
const PRODUCTION_DIR = path.join(__dirname, '..', 'production');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...getAllFiles(fullPath, baseDir));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      files.push(relativePath);
    }
  }
  
  return files;
}

function compareFiles(localFile, productionFile) {
  if (!fs.existsSync(productionFile)) {
    return { status: 'missing_in_production', message: 'File exists locally but not in production' };
  }
  
  const localContent = fs.readFileSync(localFile, 'utf-8');
  const productionContent = fs.readFileSync(productionFile, 'utf-8');
  
  if (localContent === productionContent) {
    return { status: 'identical', message: 'Files are identical' };
  }
  
  // Calculate basic difference metrics
  const localLines = localContent.split('\n').length;
  const productionLines = productionContent.split('\n').length;
  
  return {
    status: 'different',
    message: `Lines: local=${localLines}, production=${productionLines}, diff=${Math.abs(localLines - productionLines)}`,
    localContent,
    productionContent
  };
}

function main() {
  log('========================================', 'cyan');
  log('Production Code Comparison Tool', 'cyan');
  log('========================================\n', 'cyan');
  
  // Check if production directory exists
  if (!fs.existsSync(PRODUCTION_DIR)) {
    log(`Production directory not found: ${PRODUCTION_DIR}`, 'red');
    log('\nTo get production files:', 'yellow');
    log('1. Go to: https://vercel.com/mats-projects-d8392976/pryde-frontend', 'yellow');
    log('2. Click on "Deployments" tab', 'yellow');
    log('3. Find the production deployment (should have green checkmark)', 'yellow');
    log('4. Click on the 3-dot menu and select "Download Archive"', 'yellow');
    log('5. Extract the files to a "production" folder next to pryde-frontend', 'yellow');
    log('\nExpected production path:', 'yellow');
    log(`  ${PRODUCTION_DIR}\n`, 'yellow');
    return;
  }
  
  log(`Local directory: ${LOCAL_DIR}`, 'blue');
  log(`Production directory: ${PRODUCTION_DIR}\n`, 'blue');
  
  // Get all JS/JSX files
  log('Scanning files...\n', 'green');
  const localFiles = getAllFiles(LOCAL_DIR);
  
  log(`Found ${localFiles.length} local source files\n`, 'green');
  
  // Compare each file
  const results = {
    identical: [],
    different: [],
    missingInProduction: [],
    missingInLocal: []
  };
  
  for (const file of localFiles) {
    const localPath = path.join(LOCAL_DIR, file);
    const productionPath = path.join(PRODUCTION_DIR, file);
    
    const result = compareFiles(localPath, productionPath);
    
    if (result.status === 'identical') {
      results.identical.push(file);
    } else if (result.status === 'missing_in_production') {
      results.missingInProduction.push({ file, message: result.message });
    } else if (result.status === 'different') {
      results.different.push({ file, message: result.message });
    }
  }
  
  // Check for files in production that aren't local
  const productionFiles = getAllFiles(path.join(PRODUCTION_DIR, 'src'));
  for (const file of productionFiles) {
    if (!localFiles.includes(file)) {
      results.missingInLocal.push(file);
    }
  }
  
  // Output results
  log('========================================', 'cyan');
  log('COMPARISON RESULTS', 'cyan');
  log('========================================\n', 'cyan');
  
  // Summary
  log('SUMMARY:', 'magenta');
  log(`  Identical files: ${results.identical.length}`, 'green');
  log(`  Different files: ${results.different.length}`, 'yellow');
  log(`  Missing in production: ${results.missingInProduction.length}`, 'red');
  log(`  Missing in local: ${results.missingInLocal.length}`, 'red');
  log('', 'reset');
  
  // Detailed differences
  if (results.different.length > 0) {
    log('========================================', 'yellow');
    log('FILES THAT DIFFER:', 'yellow');
    log('========================================\n', 'yellow');
    
    for (const { file, message } of results.different) {
      log(`  ${file}`, 'yellow');
      log(`    ${message}`, 'reset');
    }
    log('', 'reset');
  }
  
  if (results.missingInProduction.length > 0) {
    log('========================================', 'red');
    log('FILES MISSING IN PRODUCTION:', 'red');
    log('========================================\n', 'red');
    
    for (const { file, message } of results.missingInProduction) {
      log(`  ${file}`, 'red');
      log(`    ${message}`, 'reset');
    }
    log('', 'reset');
  }
  
  if (results.missingInLocal.length > 0) {
    log('========================================', 'red');
    log('FILES IN PRODUCTION BUT NOT LOCAL:', 'red');
    log('========================================\n', 'red');
    
    for (const file of results.missingInLocal) {
      log(`  ${file}`, 'red');
    }
    log('', 'reset');
  }
  
  // Export results to JSON for further analysis
  const outputFile = path.join(__dirname, 'comparison-results.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  log(`\nDetailed results saved to: ${outputFile}\n`, 'blue');
}

main();
