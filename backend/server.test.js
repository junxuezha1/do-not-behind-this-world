import test from 'node:test';
import assert from 'node:assert/strict';

test('quota math should not go negative', () => {
  const limit = 5;
  const used = 8;
  const remaining = Math.max(0, limit - used);
  assert.equal(remaining, 0);
});
