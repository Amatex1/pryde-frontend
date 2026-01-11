import fs from 'fs';
import path from 'path';

/**
 * Vite Plugin: Inject Build Version
 * Adds a meta tag with the current build timestamp to index.html
 * and generates version.json for version polling
 * This allows the frontend to detect when a new deployment has occurred
 */

export default function buildVersionPlugin() {
  let buildVersion;
  let buildTime;

  return {
    name: 'build-version-plugin',

    buildStart() {
      // Read buildVersion from package.json
      const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
      buildVersion = packageJson.buildVersion || process.env.VITE_APP_VERSION || new Date().toISOString().split('T')[0].replace(/-/g, '-');
      buildTime = new Date().toISOString();

      console.log('📦 Building with version:', buildVersion);
      console.log('🕐 Build time:', buildTime);
    },

    transformIndexHtml(html) {
      // Inject meta tag into <head>
      return html.replace(
        '</head>',
        `  <meta name="build-version" content="${buildVersion}" />\n  <meta name="build-time" content="${buildTime}" />\n  </head>`
      );
    },

    closeBundle() {
      // Generate version.json in dist/public directory
      const versionData = {
        version: buildVersion,
        buildTime: buildTime
      };

      const distPath = path.resolve(process.cwd(), 'dist');
      const versionPath = path.join(distPath, 'version.json');

      // Ensure dist directory exists
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }

      // Write version.json
      fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
      console.log('✅ Generated version.json:', versionPath);
    }
  };
}

