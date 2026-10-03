import test from 'node:test';
import assert from 'node:assert/strict';
import { kanaCards } from '../src/data/kana.js';

test('every kana card exposes a mnemonic hint', () => {
  assert.ok(kanaCards.length > 0);
  assert.ok(kanaCards.every((card) => typeof card.mnemonic === 'string' && card.mnemonic.trim().length > 0));
});
