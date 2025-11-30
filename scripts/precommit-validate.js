#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  return res.status === 0;
}

function main() {
  const root = path.resolve(__dirname, '..');
  console.log('Running pre-commit validation (build + test + auto-fix attempts)...');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts}: running workspace build`);
    
    // Build common first
    if (!run('npm', ['--workspace', '@aurora/common', 'run', 'build', '--if-present'])) {
      console.warn('Build @aurora/common failed.');
    }
    
    // Run top-level build which invokes workspace builds
    if (run('npm', ['run', 'build'])) {
      console.log('Build succeeded. Running tests...');
      
      // Run tests
      if (run('npm', ['run', 'test', '--if-present'])) {
        console.log('Tests passed.');
        // Stage any fixes made by format/lint
        run('git', ['add', '-A']);
        return process.exit(0);
      } else {
        console.warn('Tests failed.');
        if (attempt < maxAttempts) {
          console.log('Retrying...');
          continue;
        }
      }
    }

    console.warn('Build failed. Trying automated fixes: prettier, eslint --fix, build common.');

    // Run prettier
    run('npx', ['prettier', '--write', 'packages/**/src/**/*.ts', 'packages/**/test/**/*.ts']);

    // Try lint --fix if available
    run('npm', ['-ws', 'run', 'lint', '--if-present', '--', '--fix']);

    // Build common package specifically (helps TS path issues)
    run('npm', ['--workspace', '@aurora/common', 'run', 'build', '--if-present']);
  }

  console.error('\nPre-commit validation failed after multiple attempts. Please run `npm run build && npm test` locally and fix errors.');
  process.exit(1);
}

main();
