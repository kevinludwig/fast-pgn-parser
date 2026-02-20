# fast-pgn-parser

Basic but fast PGN (Portable Game Notation) parser for Node.js, backed by C bindings to [libpgn](https://github.com/fwttnnn/libpgn).

The core parsing is implemented in C via libpgn and exposed to Node.js through native bindings.

## Status

In development. N-API bindings to libpgn are in place: libpgn is built and **statically linked** into the native addon. If the addon fails to build (no git, no C++ toolchain), the module throws at load time.

## API

- **`parse(pgnText)`** — Parses PGN text and returns an **array of game objects**. Each game has:
  - **`tags`** — Object of key/value PGN headers (e.g. `Event`, `White`, `Black`, `Result`).
  - **`moves`** — Array of move strings (SAN notation).
  - **`pgntext`** — the raw PGN text for that game only.

Example:

```js
import { parse } from 'fast-pgn-parser';

const games = parse(pgnText);
for (const game of games) {
  console.log(game.tags.Event, game.tags.White, 'vs', game.tags.Black);
  console.log(game.moves);  // ['e4', 'e5', 'Nf3', ...]
  console.log(game.pgntext); // is the unparsed PGN for this game
}
```

## Project layout

- **`src/`** — Node.js API and N-API addon (`binding.cc`)
- **`test/`** — Tests (`node --test`)
- **`vendor/`** — [libpgn](https://github.com/fwttnnn/libpgn) is cloned into `vendor/libpgn` on install (see `vendor/README.md`)

## Scripts

- `npm install` — install deps, clone libpgn if needed, build native addon (fails if addon cannot be built)
- `npm run rebuild` — rebuild the native addon (node-gyp)
- `npm test` — run tests
- `npm run test:coverage` — run tests with coverage (c8)
- `npm run benchmark` — benchmark `parse()` vs [pgn-parser](https://www.npmjs.com/package/pgn-parser) using `scripts/games.pgn` (default 100 runs; `node scripts/benchmark-parse.mjs [path] [N]`)

## Building the native addon

- **Node.js** ≥ 18
- **Git** — to clone libpgn (or add `vendor/libpgn` manually)
- **C/C++ toolchain** — [node-gyp](https://github.com/nodejs/node-gyp#installation) (e.g. Visual Studio Build Tools on Windows, Xcode CLI on macOS, build-essential on Linux)

On Windows, **Visual Studio 18** (version 18 in the install path) is supported via a postinstall script (`scripts/fix-node-gyp-vs18.cjs`) that applies the same approach as projects like bitboard-chess: node-gyp is adjusted so version 18 is treated as 2022 and the v145 toolset is used when the path contains `\18\`. No patch file is used.

After `npm install`, the addon is in `build/Release/pgn_parser.node`. If the addon did not build, importing the module throws.
