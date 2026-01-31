/**
 * scan-unused-utils.js
 *
 * Scans src/utils for usage across src/
 * Reports which utilities are imported and which appear unused.
 *
 * READ-ONLY — no files are modified.
 */

import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve("src");
const UTILS_DIR = path.join(SRC_DIR, "utils");

if (!fs.existsSync(UTILS_DIR)) {
  console.error("❌ src/utils directory not found");
  process.exit(1);
}

// Collect utility files
const utils = fs
  .readdirSync(UTILS_DIR)
  .filter(f => f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".jsx"));

const usageMap = Object.fromEntries(
  utils.map(u => [u, []])
);

// Recursively walk src/
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (
      entry.isFile() &&
      /\.(js|ts|jsx|tsx)$/.test(entry.name)
    ) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const util of utils) {
        const utilName = util.replace(/\.(js|ts|jsx)$/, "");
        // Match any depth of relative imports: ./utils/, ../utils/, ../../utils/, etc.
        // Also match @/utils/ alias and require() calls
        const importPattern = new RegExp(
          `(?:from\\s+['"](?:\\.\\.\\/)*utils\\/${utilName}['"])|` +
          `(?:from\\s+['"]\\.\\/${utilName}['"])|` +  // Same folder import
          `(?:from\\s+['"]@\\/utils\\/${utilName}['"])|` +
          `(?:require\\s*\\(\\s*['"](?:\\.\\.\\/)*utils\\/${utilName}['"]\\s*\\))|` +
          `(?:import\\s+.*\\s+from\\s+['"].*utils\\/${utilName}['"])`
        );
        if (importPattern.test(content)) {
          usageMap[util].push(path.relative(SRC_DIR, fullPath));
        }
      }
    }
  }
}

walk(SRC_DIR);

// Report
console.log("\n📊 UNUSED UTILITY SCAN REPORT\n");

const used = [];
const unused = [];

for (const [util, files] of Object.entries(usageMap)) {
  if (files.length > 0) {
    used.push({ util, count: files.length });
  } else {
    unused.push(util);
  }
}

console.log("✅ USED UTILITIES:");
used.forEach(u =>
  console.log(`  - ${u.util} (${u.count} file${u.count > 1 ? "s" : ""})`)
);

console.log("\n⚠️ POSSIBLY UNUSED UTILITIES:");
if (unused.length === 0) {
  console.log("  🎉 None detected");
} else {
  unused.forEach(u => console.log(`  - ${u}`));
}

console.log("\nℹ️ Notes:");
console.log(
  "- Conditional or dynamic imports may not be detected\n" +
  "- Service Worker utilities are often intentionally idle\n" +
  "- Verify before deleting anything\n"
);
