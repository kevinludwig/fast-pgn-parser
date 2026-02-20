#!/usr/bin/env node
/**
 * Ensures vendor/libpgn exists (clones from GitHub if missing).
 * Run before node-gyp so the native addon can build and link libpgn.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const vendorLibpgn = path.join(__dirname, '..', 'vendor', 'libpgn');
const pgnC = path.join(vendorLibpgn, 'pgn.c');

if (fs.existsSync(pgnC)) {
  console.log('vendor/libpgn already present');
  runNodeGyp();
  process.exit(0);
}

const vendorDir = path.join(__dirname, '..', 'vendor');
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true });
}
try {
  console.log('Cloning libpgn into vendor/libpgn...');
  execSync('git clone --depth 1 https://github.com/fwttnnn/libpgn.git libpgn', {
    cwd: vendorDir,
    stdio: 'inherit',
  });
  console.log('libpgn cloned successfully');
} catch (err) {
  console.warn('Could not clone libpgn (native addon will not be built):', err.message);
  process.exit(0);
}

if (fs.existsSync(pgnC)) {
  runNodeGyp();
}

function runNodeGyp() {
  try {
    execSync('node-gyp rebuild', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (err) {
    console.warn('node-gyp rebuild failed; using JS stub:', err.message);
  }
}
