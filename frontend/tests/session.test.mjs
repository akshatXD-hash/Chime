import { test } from 'node:test';
import assert from 'node:assert/strict';

const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
};

test('two tabs retain independent sessions across login, logout and reload', async () => {
  globalThis.localStorage = storage();
  const aliceTab = storage();
  const bobTab = storage();
  globalThis.sessionStorage = aliceTab;
  const alice = await import('../src/utils/session.js?alice');
  alice.saveSession({ user: { _id: 'alice' }, token: 'alice-token' });
  globalThis.sessionStorage = bobTab;
  const bob = await import('../src/utils/session.js?bob');
  assert.equal(bob.getSession().user._id, 'alice');
  bob.clearSession();
  bob.saveSession({ user: { _id: 'bob' }, token: 'bob-token' });
  assert.equal(alice.getSession().token, 'alice-token');
  assert.equal(bob.getSession().token, 'bob-token');
  globalThis.sessionStorage = aliceTab;
  const reloadedAlice = await import('../src/utils/session.js?aliceReloaded');
  assert.equal(reloadedAlice.getSession().user._id, 'alice');
  reloadedAlice.clearSession();
  assert.equal(localStorage.getItem('chime_token'), 'bob-token');
  globalThis.sessionStorage = bobTab;
  const reloadedBob = await import('../src/utils/session.js?bobReloaded');
  assert.equal(reloadedBob.getSession().user._id, 'bob');
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
});
