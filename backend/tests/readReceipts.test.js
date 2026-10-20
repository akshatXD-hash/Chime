import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markMessagesRead } from '../controllers/message.controller.js';
import { Chat } from '../models/chatModel.js';
import { Message } from '../models/messageModel.js';

const chatId = '111111111111111111111111';
const reader = '222222222222222222222222';
const sender = '333333333333333333333333';
const messageId = '444444444444444444444444';
const foreignId = '555555555555555555555555';

function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

function request(messageIds = [messageId]) {
  return { params: { chatId }, body: { messageIds }, user: { id: reader }, app: { get: () => null } };
}

test('rejects malformed and oversized read batches before querying the database', async () => {
  for (const ids of [undefined, [], ['invalid'], Array(101).fill(messageId)]) {
    const res = response();
    const req = request();
    req.body = { messageIds: ids };
    await markMessagesRead(req, res);
    assert.equal(res.code, 400);
  }
});

test('only chat members can update read status', async (t) => {
  t.mock.method(Chat, 'findOne', (filter) => {
    assert.deepEqual(filter, { _id: chatId, users: reader });
    return { select: async () => null };
  });
  const res = response();
  await markMessagesRead(request(), res);
  assert.equal(res.code, 403);
});

test('records the authenticated reader and broadcasts only matching incoming messages', async (t) => {
  const events = [];
  t.mock.method(Chat, 'findOne', () => ({ select: async () => ({ users: [reader, sender] }) }));
  t.mock.method(Message, 'find', (filter) => {
    assert.equal(filter.chat, chatId);
    assert.deepEqual(filter.sender, { $ne: reader });
    assert.deepEqual(filter._id, { $in: [messageId, foreignId] });
    return { select: async () => [{ _id: messageId }] };
  });
  t.mock.method(Message, 'updateMany', async (filter, update) => {
    assert.deepEqual(filter, { _id: { $in: [messageId] }, chat: chatId });
    assert.deepEqual(update, { $addToSet: { readBy: reader } });
  });
  const req = request([messageId, foreignId]);
  req.body.userId = sender;
  req.app.get = () => ({ to: (rooms) => ({ emit: (event, payload) => events.push({ rooms, event, payload }) }) });
  const res = response();
  await markMessagesRead(req, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { chatId, messageIds: [messageId], userId: reader });
  assert.deepEqual(events, [{ rooms: [reader, sender], event: 'messages-read', payload: res.body }]);
});

test('does not broadcast a read receipt when no messages match', async (t) => {
  t.mock.method(Chat, 'findOne', () => ({ select: async () => ({ users: [reader, sender] }) }));
  t.mock.method(Message, 'find', () => ({ select: async () => [] }));
  const update = t.mock.method(Message, 'updateMany', async () => {});
  const res = response();
  await markMessagesRead(request(), res);
  assert.deepEqual(res.body.messageIds, []);
  assert.equal(update.mock.callCount(), 0);
});

test('new and older messages start without read receipts', () => {
  const message = new Message({ sender, chat: chatId, content: 'Hello' });
  assert.deepEqual([...message.readBy], []);
});
