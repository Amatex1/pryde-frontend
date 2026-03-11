#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SECRET_PATTERNS = [
  { name: 'MongoDB Connection String', pattern: /mongodb(\+srv)?:\/\/[^:\s]+:[^@\s]+@[^\s"']+/gi },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/gi },
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'Resend API Key', pattern: /re_[a-zA-Z0-9]{30,}/g },
  { name: 'Generic API Key', pattern: /['"](sk|pk|api)_[a-zA-Z0-9]{20,}['"]/gi },
  { name: 'Password in URL', pattern: /[a-z]+:\/\/[^/\s:@]+:[^/\s@]+@[^/\s]+/gi },
  { name: 'Quoted secret value', pattern: /(secret|password|passwd|pwd)\s*[:=]\s*["'][^"'\s]{16,}["']/gi }
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /dist/,
  /coverage/,
  /build/,
  /\.git/,
  /package-lock\.json$/,
  /security-scan\.js$/
];

const PLACEHOLDER_PATTERNS = [
  /example/i,
  /placeholder/i,
  /your[-_]?.*[-_]?here/i,
  /replace[-_]?this/i,
  /change[-_]?me/i,
  /\$\{.*\}/,
  /\*\*\*\*\*/,
  /xxx/i
];

let issuesFound = 0;

function shouldScan(filePath) {
  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isPlaceholder(match) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(match));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const { name, pattern } of SECRET_PATTERNS) {
      const matches = content.match(pattern) || [];
      for (const match of matches) {
        if (isPlaceholder(match)) {
          continue;
        }

        issuesFound += 1;
        console.error(`❌ ${filePath}`);
        console.error(`   ${name}: ${match.slice(0, 80)}${match.length > 80 ? '…' : ''}`);
      }
    }
  } catch {
    // Ignore binary files / unreadable files.
  }
}

function getFilesToScan() {
  try {
    const output = execSync('git ls-files -z --cached --others --exclude-standard', {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString('utf8');

    return output
      .split('\0')
      .filter(Boolean)
      .map((filePath) => path.join(process.cwd(), filePath))
      .filter((filePath) => shouldScan(filePath));
  } catch {
    return collectFiles(process.cwd());
  }
}

function collectFiles(dirPath, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (!shouldScan(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

console.log('🔍 Pryde frontend secret scan');
for (const filePath of getFilesToScan()) {
  scanFile(filePath);
}

if (issuesFound > 0) {
  console.error(`\n⚠️ Found ${issuesFound} potential secret issue(s).`);
  process.exit(1);
}

console.log('✅ No credential leaks detected.');