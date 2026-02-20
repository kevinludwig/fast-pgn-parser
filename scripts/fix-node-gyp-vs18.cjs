#!/usr/bin/env node
/**
 * Apply the same VS 18 fix as bitboard-chess (no patch file):
 * - Map version 18 to versionYear 2022 so node-gyp accepts it via [2019, 2022]
 * - In getToolset, use v145 when install path contains \18\, else v143 for 2022
 * Idempotent: safe to run on vanilla or already-patched node-gyp.
 */
const fs = require('fs');
const path = require('path');

const findVs = path.join(
  __dirname,
  '..',
  'node_modules',
  'node-gyp',
  'lib',
  'find-visualstudio.js'
);

if (!fs.existsSync(findVs)) {
  process.exit(0);
}

let code = fs.readFileSync(findVs, 'utf8');

// 1) getVersionInfo: versionMajor 18 -> versionYear 2022 (so [2019, 2022] accepts it)
code = code.replace(
  /(if \(ret\.versionMajor === 18\) \{\s*)ret\.versionYear = 2026/,
  '$1ret.versionYear = 2022'
);
if (!code.includes('if (ret.versionMajor === 18)')) {
  code = code.replace(
    /(if \(ret\.versionMajor === 17\) \{\s*ret\.versionYear = 2022\s*return ret\s*\})\s*(this\.log\.silly\('- unsupported version:', ret\.versionMajor\))/,
    "$1\n    if (ret.versionMajor === 18) {\n      ret.versionYear = 2022\n      return ret\n    }\n    $2"
  );
}

// 2) supportedYears: use [2019, 2022] only
code = code.replace(/\[2019, 2022, 2026\]/g, '[2019, 2022]');

// 3) getToolset: for 2022 use v145 when path has \18\, else v143; remove 2026 branch if present
if (!code.includes("includes('\\\\18\\\\')")) {
  code = code.replace(
    /(versionYear === 2022\) \{\s*)return 'v143'/,
    "$1return (info.path && info.path.includes('\\\\18\\\\')) ? 'v145' : 'v143'"
  );
  code = code.replace(
    /\s*\} else if \(versionYear === 2026\) \{\s*return 'v145'\s*\}/m,
    '\n    }'
  );
}

fs.writeFileSync(findVs, code, 'utf8');
