#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  return res.status === 0;
}

function main() {
  const root = path.resolve(__dirname, '..');
  console.log('Running pre-commit validation (build + auto-fix attempts)...');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts}: running workspace build`);
    // run top-level build which invokes workspace builds
    if (run('npm', ['run', 'build'])) {
      console.log('Build succeeded.');
      // Stage any fixes made by format/lint
      run('git', ['add', '-A']);
      return process.exit(0);
    }

    console.warn('Build failed. Trying automated fixes: prettier, eslint --fix, build common.');

    // Run prettier
    run('npx', ['prettier', '--write', 'packages/**/src/**/*.ts', 'packages/**/test/**/*.ts']);

    // Try lint --fix if available
    run('npm', ['-ws', 'run', 'lint', '--if-present', '--', '--fix']);

    // Build common package specifically (helps TS path issues)
    run('npm', ['--workspace', '@aurora/common', 'run', 'build', '--if-present']);

    // small pause
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }

  console.error('\nPre-commit validation failed after multiple attempts. Please run `npm run build` locally and fix TypeScript errors.');
  process.exit(1);
}

main();
