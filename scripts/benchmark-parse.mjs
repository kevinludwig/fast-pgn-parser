#!/usr/bin/env node
/**
 * Benchmark: fast-pgn-parser parse() vs pgn-parser parse()
 * Usage: node scripts/benchmark-parse.mjs [path-to.pgn] [N]
 * Defaults: scripts/games.pgn, N=100
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as ourParse, isNative } from '../src/index.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pgnParser = require('pgn-parser');

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const pgnPath = process.argv[2] || join(rootDir, 'scripts', 'games.pgn');
const N = parseInt(process.argv[3] || '100', 10);

let pgnText;
try {
  pgnText = readFileSync(pgnPath, 'utf8');
  pgnText = pgnText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
} catch (err) {
  console.error('Failed to read:', pgnPath, err.message);
  process.exit(1);
}

const bytes = Buffer.byteLength(pgnText, 'utf8');
const gameCount = ourParse(pgnText).length;
console.log('Input:', pgnPath);
console.log('Size:', (bytes / 1024).toFixed(2), 'KB, games:', gameCount);
console.log('Runs:', N);
console.log('fast-pgn-parser (native):', isNative());
console.log('');

function timeIt(name, fn) {
  const start = performance.now();
  for (let i = 0; i < N; i++) fn();
  const elapsed = performance.now() - start;
  const perRun = elapsed / N;
  const opsPerSec = (N / elapsed) * 1000;
  console.log(name);
  console.log('  total:', elapsed.toFixed(2), 'ms');
  console.log('  per parse:', perRun.toFixed(4), 'ms');
  console.log('  ops/sec:', opsPerSec.toFixed(1));
  console.log('');
  return elapsed;
}

const ourMs = timeIt('fast-pgn-parser', () => ourParse(pgnText));
const theirMs = timeIt('pgn-parser', () => pgnParser.parse(pgnText));

const ratio = theirMs / ourMs;
console.log('Ratio (pgn-parser / fast-pgn-parser):', ratio.toFixed(2) + 'x');
