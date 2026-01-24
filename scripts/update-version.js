/**
 * Auto-update version.json before each build
 * 
 * This script runs automatically during Vercel builds to ensure
 * the version changes on every deploy, triggering the update banner.
 * 
 * Version format: YYYY.MM.DD-HHmm (e.g., 2026.01.24-1430)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate version string from current timestamp
function generateVersion() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day}-${hours}${minutes}`;
}

// Update version.json
function updateVersionJson() {
  const versionPath = path.join(__dirname, '..', 'public', 'version.json');
  const version = generateVersion();
  const buildTime = new Date().toISOString();
  
  const versionData = {
    version,
    buildTime,
    notes: `Auto-generated build ${version}`
  };
  
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`✅ Updated version.json to ${version}`);
  
  return version;
}

// Update package.json buildVersion
function updatePackageJson(version) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  packageJson.buildVersion = version;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated package.json buildVersion to ${version}`);
}

// Main
const version = updateVersionJson();
updatePackageJson(version);

console.log(`\n🚀 Build version: ${version}`);

