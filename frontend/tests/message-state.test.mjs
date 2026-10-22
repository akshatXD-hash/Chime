import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessage, applyReceipt, isMessageRead, isMessageDelivered, upsertMessage } from '../src/utils/messageReceipts.js';
import { getErrorMessage, SESSION_EXPIRED } from '../src/utils/errorMessages.js';

const message = { _id: 'message', sender: { _id: 'sender' }, content: 'Hello' };

test('blue ticks require every recipient, never just the sender', () => {
  assert.equal(isMessageRead(message, ['sender', 'reader']), false);
  assert.equal(isMessageRead({ ...message, readBy: ['sender'] }, ['sender', 'reader']), false);
  assert.equal(isMessageRead({ ...message, readBy: ['reader'] }, ['sender', 'reader']), true);
  assert.equal(isMessageRead({ ...message, readBy: ['reader'] }, ['sender', 'reader', 'other']), false);
  assert.equal(isMessageRead({ ...message, readBy: [{ _id: 'reader' }, 'other'] }, ['sender', 'reader', 'other']), true);
  assert.equal(isMessageRead(message, []), false);
});

test('delayed refreshes cannot remove an existing read receipt', () => {
  const receipt = { messageIds: ['message'], userId: 'reader' };
  const read = applyReceipt(message, receipt);
  assert.deepEqual(applyReceipt(read, receipt).readBy, ['reader']);
  assert.deepEqual(mergeMessage(read, message).readBy, ['reader']);
  assert.equal(applyReceipt(message, { ...receipt, messageIds: ['different'] }), message);
});

test('session and sign-in errors use helpful messages rather than server details', () => {
  const error = { response: { status: 401, data: { message: 'jwt malformed: Invalid token' } }, config: { url: '/api/chat' } };
  assert.equal(getErrorMessage(error), SESSION_EXPIRED);
  assert.equal(getErrorMessage({ ...error, config: { url: '/api/auth/signin' } }), 'The email or password is incorrect. Please try again.');
});

test('network, timeout, server and signup errors never expose raw diagnostics', () => {
  assert.match(getErrorMessage({ code: 'ERR_NETWORK' }), /internet connection/);
  assert.match(getErrorMessage({ code: 'ECONNABORTED' }), /longer than expected/);
  assert.match(getErrorMessage({ response: { status: 500, data: { message: 'MongoServerError: secret' } } }), /our end/);
  assert.match(getErrorMessage({ response: { status: 409 }, config: { url: '/api/auth/signup' } }), /already exists/);
});

test('delivery does not imply reading and read receipts imply delivery', () => {
  const delivered = applyReceipt(message, { messageIds: ['message'], userId: 'reader', kind: 'delivered' });
  assert.equal(isMessageDelivered(delivered, ['sender', 'reader']), true);
  assert.equal(isMessageRead(delivered, ['sender', 'reader']), false);
  const read = applyReceipt(message, { messageIds: ['message'], userId: 'reader', kind: 'read' });
  assert.equal(isMessageDelivered(read, ['sender', 'reader']), true);
  assert.equal(isMessageRead(read, ['sender', 'reader']), true);
});

test('socket echoes replace pending messages and keep receipts from earlier echoes', () => {
  const pending = { ...message, _id: 'pending', clientMessageId: 'request', isOptimistic: true };
  const saved = { ...message, clientMessageId: 'request' };
  const echoed = upsertMessage([pending], { ...saved, readBy: ['reader'] });
  const confirmed = upsertMessage(echoed, saved);
  assert.equal(confirmed.length, 1);
  assert.equal(confirmed[0].isOptimistic, false);
  assert.deepEqual(confirmed[0].readBy, ['reader']);
});
