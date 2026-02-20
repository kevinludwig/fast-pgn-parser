import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parse } from '../src/index.js';

const samplePgn = `[Event "Example"]
[White "A"]
[Black "B"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 *

`;

const twoGames = samplePgn + `
[Event "Second"]
[White "C"]
[Black "D"]

1. d4 d5 *
`;

const pgnWithResults = `[Event "W"]
[White "W"]
[Black "B"]
[Result "1-0"]

1. e4 *

[Event "L"]
[Result "0-1"]

1. e4 e5 2. Ke2 *

[Event "D"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Nf3 *
`;

describe('parse', () => {
  it('returns an array of game objects', () => {
    const games = parse(samplePgn);
    assert.strictEqual(games.length, 1);
    assert.strictEqual(typeof games[0], 'object');
    assert.ok('tags' in games[0]);
    assert.ok('moves' in games[0]);
  });

  it('each game has tags (key/value) and moves (array of strings)', () => {
    const games = parse(samplePgn);
    assert.strictEqual(games[0].tags.Event, 'Example');
    assert.strictEqual(games[0].tags.White, 'A');
    assert.strictEqual(games[0].tags.Black, 'B');
    assert.ok(Array.isArray(games[0].moves));
    assert.ok(games[0].moves.length >= 4);
    assert.strictEqual(games[0].moves[0], 'e4');
    assert.strictEqual(games[0].moves[1], 'e5');
  });

  it('returns multiple games', () => {
    const games = parse(twoGames);
    assert.strictEqual(games.length, 2);
    assert.strictEqual(games[0].tags.Event, 'Example');
    assert.strictEqual(games[1].tags.Event, 'Second');
    assert.strictEqual(games[1].tags.White, 'C');
  });

  it('returns empty array for empty string', () => {
    const games = parse('');
    assert.strictEqual(games.length, 0);
  });

  it('each game includes pgntext when available', () => {
    const games = parse(samplePgn);
    assert.ok('pgntext' in games[0]);
    assert.strictEqual(typeof games[0].pgntext, 'string');
    assert.ok(games[0].pgntext.includes('[Event "Example"]'));
    assert.ok(games[0].pgntext.includes('1. e4 e5'));
  });

  it('pgntext is the raw PGN for that game only', () => {
    const games = parse(twoGames);
    assert.ok(!games[0].pgntext.includes('Second'));
    assert.ok(games[1].pgntext.includes('[Event "Second"]'));
  });

  it('pgntext contains only that game\'s tags and moves, not other games', () => {
    const games = parse(twoGames);
    assert.ok(games.length >= 2, 'need multiple games');
    assert.ok(games[0].pgntext != null && games[0].pgntext.length > 0);
    assert.ok(games[1].pgntext != null && games[1].pgntext.length > 0);
    assert.ok(games[0].pgntext.includes('[Event "Example"]'), 'game 0 pgntext should include its Event tag');
    assert.ok(games[0].pgntext.includes('1. e4 e5'), 'game 0 pgntext should include its moves');
    assert.ok(!games[0].pgntext.includes('Second'), 'game 0 pgntext must not contain the other game\'s Event');
    assert.ok(!games[0].pgntext.includes('d4'), 'game 0 pgntext must not contain the other game\'s moves');
    assert.ok(games[1].pgntext.includes('[Event "Second"]'), 'game 1 pgntext should include its Event tag');
    assert.ok(games[1].pgntext.includes('1. d4 d5'), 'game 1 pgntext should include its moves');
    assert.ok(!games[1].pgntext.includes('Example'), 'game 1 pgntext must not contain the other game\'s Event');
    assert.ok(!games[1].pgntext.includes('Bb5'), 'game 1 pgntext must not contain the other game\'s moves');
  });

  it('parses games with Result tag', () => {
    const games = parse(pgnWithResults);
    assert.strictEqual(games.length, 3);
    assert.strictEqual(games[0].tags.Result, '1-0');
    assert.strictEqual(games[1].tags.Result, '0-1');
    assert.strictEqual(games[2].tags.Result, '1/2-1/2');
  });
});
