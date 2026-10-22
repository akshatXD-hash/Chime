import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { startLocalServer, api } from './localServer.js';

const server = await startLocalServer();
const sockets = [];
const waitEvent = (socket, event, predicate = () => true) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { socket.off(event, handler); reject(new Error(`Timed out: ${event}`)); }, 8000);
  const handler = (data) => {
    if (!predicate(data)) return;
    clearTimeout(timer); socket.off(event, handler); resolve(data);
  };
  socket.on(event, handler);
});
async function connect(token) {
  const socket = io(server.url, { auth: { token }, transports: ['websocket'], reconnection: false });
  sockets.push(socket);
  await waitEvent(socket, 'connect');
  return socket;
}
try {
  const account = (name) => api(server.url, '/api/auth/signup', { method: 'POST', body: { name, email: `${name}@example.test`, password: 'test-pass-123' } });
  const alice = await account('Alice');
  const bob = await account('Bob');
  const charlie = await account('Charlie');
  const chat = await api(server.url, '/api/chat', { token: alice.token, method: 'POST', body: { userId: bob.user._id } });
  const a = await connect(alice.token);
  const b = await connect(bob.token);
  const incoming = waitEvent(b, 'receive-message');
  const sent = await api(server.url, '/api/message', {
    token: alice.token, cookie: `token=${bob.token}`, method: 'POST',
    body: { chatId: chat._id, content: 'Alice owns this message', clientMessageId: 'alice-one' },
  });
  assert.equal(sent.sender._id, alice.user._id);
  assert.equal((await incoming)._id, sent._id);
  const delivered = waitEvent(a, 'messages-delivered');
  await api(server.url, `/api/message/${chat._id}/delivered`, { token: bob.token, method: 'PATCH', body: { messageIds: [sent._id] } });
  assert.equal((await delivered).userId, bob.user._id);
  const read = waitEvent(a, 'messages-read');
  await api(server.url, `/api/message/${chat._id}/read`, { token: bob.token, method: 'PATCH', body: { messageIds: [sent._id] } });
  assert.deepEqual((await read).messageIds, [sent._id]);
  let history = await api(server.url, `/api/message/${chat._id}`, { token: alice.token });
  assert.deepEqual(history[0].readBy, [bob.user._id]);
  assert.deepEqual(history[0].deliveredTo, [bob.user._id]);
  await api(server.url, `/api/message/${chat._id}/read`, { token: bob.token, method: 'PATCH', body: { messageIds: [sent._id] } });
  history = await api(server.url, `/api/message/${chat._id}`, { token: alice.token });
  assert.equal(history[0].readBy.length, 1);
  await assert.rejects(api(server.url, `/api/message/${chat._id}`, { token: charlie.token }), /403/);
  await assert.rejects(api(server.url, '/api/message', { token: charlie.token, method: 'POST', body: { chatId: chat._id, content: 'Not a member' } }), /403/);
  await assert.rejects(api(server.url, `/api/message/${chat._id}/read`, { token: charlie.token, method: 'PATCH', body: { messageIds: [sent._id] } }), /403/);
  const b2 = await connect(bob.token);
  const presence = waitEvent(a, 'get-online-users', (users) => users.includes(bob.user._id));
  b.disconnect();
  await presence;
  const reply = waitEvent(a, 'receive-message');
  const savedReply = await api(server.url, '/api/message', { token: bob.token, cookie: `token=${alice.token}`, method: 'POST', body: { chatId: chat._id, content: 'Bob replies', clientMessageId: 'bob-one' } });
  assert.equal((await reply).sender._id, bob.user._id);
  assert.equal(savedReply.sender._id, bob.user._id);
  b2.disconnect();
  const offline = await api(server.url, '/api/message', { token: alice.token, method: 'POST', body: { chatId: chat._id, content: 'While Bob was away' } });
  await connect(bob.token);
  history = await api(server.url, `/api/message/${chat._id}`, { token: bob.token });
  assert.equal(history.length, 3);
  assert.ok(history.some((message) => message._id === offline._id));
  const group = await api(server.url, '/api/chat/group', { token: alice.token, method: 'POST', body: { name: 'Three people', users: [bob.user._id, charlie.user._id] } });
  const groupMessage = await api(server.url, '/api/message', { token: alice.token, method: 'POST', body: { chatId: group._id, content: 'For both recipients' } });
  for (const reader of [bob, charlie]) await api(server.url, `/api/message/${group._id}/read`, { token: reader.token, method: 'PATCH', body: { messageIds: [groupMessage._id] } });
  const groupHistory = await api(server.url, `/api/message/${group._id}`, { token: alice.token });
  assert.equal(groupHistory[0].readBy.length, 2);
  const bad = io(server.url, { auth: { token: 'invalid' }, reconnection: false });
  sockets.push(bad);
  assert.equal((await waitEvent(bad, 'connect_error')).data.code, 'SESSION_EXPIRED');
  console.log('PASS: real HTTP, MongoDB persistence, authenticated sockets, sender identity, delivery/read events, multi-tab presence, offline catch-up, membership and group receipts');
} finally {
  sockets.forEach((socket) => socket.disconnect());
  await server.stop();
}
