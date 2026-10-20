import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessage, applyReceipt, isMessageRead } from '../src/utils/messageReceipts.js';
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
