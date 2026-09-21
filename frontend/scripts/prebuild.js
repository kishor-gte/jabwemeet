const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');

function clean() {
  if (!fs.existsSync(nextDir)) return;

  const isWin = process.platform === 'win32';

  function tryRemove() {
    try {
      if (isWin) {
        execSync(`cmd /c "if exist \"${nextDir}\" rmdir /s /q \"${nextDir}\""`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${nextDir}"`, { stdio: 'ignore' });
      }
      return !fs.existsSync(nextDir);
    } catch {
      return false;
    }
  }

  // Attempt 1: Direct removal
  if (tryRemove()) {
    console.log('[prebuild] Cleaned .next build artifacts.');
    return;
  }

  // Attempt 2: If locked on Windows, check for dev server holding files on port 3000
  if (isWin) {
    try {
      const netstatOutput = execSync('netstat -ano', { encoding: 'utf8' });
      const lines = netstatOutput.split('\n');
      for (const line of lines) {
        if (line.includes(':3000') && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            console.log(`[prebuild] Detected running dev server (PID ${pid}) locking .next files. Stopping it...`);
            try {
              execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
            } catch {}
          }
        }
      }
    } catch {}

    // Wait a brief moment for OS file handles to release
    const start = Date.now();
    while (Date.now() - start < 600) {}

    // Retry removal after releasing locks
    if (tryRemove()) {
      console.log('[prebuild] Successfully released locks and cleaned .next directory.');
      return;
    }
  }

  // If still partially existing, try standard Node force removal with retries
  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log('[prebuild] Cleaned .next directory via fs.rmSync.');
  } catch (err) {
    console.warn('[prebuild] Warning: Could not fully clear .next directory. Build will attempt to continue.', err.message);
  }
}

clean();
