import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/authMiddleware.js';

test('the explicit account wins over a cookie from another tab', () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'local-test-secret';
  try {
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 'alice' }, process.env.JWT_SECRET)}` }, cookies: { token: jwt.sign({ id: 'bob' }, process.env.JWT_SECRET) } };
    let passed = false;
    authMiddleware(req, {}, () => { passed = true; });
    assert.equal(passed, true);
    assert.equal(req.user.id, 'alice');
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
