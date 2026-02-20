/**
 * PGN parser — public API: parse(string) returns an array of game objects.
 * Requires the native addon (C bindings to libpgn). Throws if the addon failed to build.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let nativeBinding = null;
try {
  nativeBinding = require('../build/Release/pgn_parser.node');
} catch {
  try {
    nativeBinding = require('../build/Debug/pgn_parser.node');
  } catch (err) {
    throw new Error(
      'fast-pgn-parser: native addon failed to load. Ensure the C bindings are built (npm install / npm run rebuild). ' +
        'You need Git, a C/C++ toolchain, and Node.js ≥18. Original error: ' + err.message
    );
  }
}

if (!nativeBinding || typeof nativeBinding.Parser !== 'function') {
  throw new Error('fast-pgn-parser: native addon did not expose Parser. Rebuild with: npm run rebuild');
}

/**
 * Game object returned by parse().
 * @typedef {{
 *   tags: { [key: string]: string },
 *   moves: string[],
 *   pgntext?: string
 * }} Game
 */

/**
 * Parse PGN text and return an array of game objects.
 * Each game has `tags` (key/value headers), `moves` (array of SAN strings), and when available `pgntext` (raw PGN for that game).
 *
 * @param {string} pgnText - Full PGN string (one or more games).
 * @returns {Game[]}
 */
export function parse(pgnText) {
  const games = [];
  const parser = new nativeBinding.Parser(pgnText);
  while (true) {
    const g = parser.nextGame();
    if (g === null) break;
    games.push({
      tags: g.tags,
      moves: Array.isArray(g.moves) ? g.moves : [],
      pgntext: g.pgntext,
    });
  }
  return games;
}

/** @returns {boolean} True if the native libpgn addon is in use (always true when the module loads successfully). */
export function isNative() {
  return true;
}
