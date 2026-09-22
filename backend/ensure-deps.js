const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function ensureDependencies() {
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = Object.keys(pkg.dependencies || {});
    const nodeModulesPath = path.join(__dirname, 'node_modules');

    const missing = deps.filter((dep) => {
      const depDir = path.join(nodeModulesPath, ...dep.split('/'));
      return !fs.existsSync(depDir);
    });

    if (missing.length > 0) {
      console.log(`[JabWeMeet] Missing dependencies detected: ${missing.join(', ')}. Auto-installing...`);
      execSync(`npm install ${missing.join(' ')}`, { cwd: __dirname, stdio: 'inherit' });
      console.log('[JabWeMeet] Missing dependencies installed successfully.');
    }
  } catch (err) {
    console.warn('[JabWeMeet] Dependency check warning:', err.message);
  }
}

if (require.main === module) {
  ensureDependencies();
}

module.exports = ensureDependencies;
