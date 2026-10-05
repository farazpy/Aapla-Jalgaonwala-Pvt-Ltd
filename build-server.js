import esbuild from 'esbuild';

esbuild.buildSync({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  banner: {
    js: `// Ensure .env is loaded at the very top of server.cjs before any modules evaluate
(function loadEnvAtStartup() {
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenv = require('dotenv');

    const candidatePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '..', '.env'),
      path.resolve(__dirname, '.env'),
      path.resolve(process.cwd(), '..', '.env')
    ];

    let loaded = false;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const result = dotenv.config({ path: p });
        if (!result.error) {
          console.log('[System Env] Successfully loaded .env from:', p);
          loaded = true;
          break;
        }
      }
    }

    if (!loaded) {
      console.warn('[System Env] Notice: No .env file found in search paths:', candidatePaths);
    }
  } catch (err) {
    console.warn('[System Env] Warning while loading .env:', err?.message || err);
  }
})();`
  },
  outfile: 'dist/server.cjs',
});

console.log('✅ Server built successfully to dist/server.cjs');

