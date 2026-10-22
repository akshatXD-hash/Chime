const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true, channel: process.env.CHIME_BROWSER || 'msedge' });
const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') console.log('Browser:', msg.text()); });
page.on('requestfailed', (req) => console.log('Request failed:', req.url(), req.failure()?.errorText));
page.on('pageerror', (error) => { errors.push(error.message); console.error(error.message); });
page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(60000);
const me = { _id: 'me', name: 'Jamie', email: 'jamie@example.test' };
const alex = { _id: 'alex', name: 'Alex Morgan', email: 'alex@example.test' };
const sam = { _id: 'sam', name: 'Sam Rivera', email: 'sam@example.test', pic: '/missing-avatar.svg' };
const chats = [
  { _id: 'a', users: [me, alex], updatedAt: '2026-10-20T10:00:00Z' },
  { _id: 'b', users: [me, sam], updatedAt: '2026-10-20T09:00:00Z' },
];
const message = (id, content, chat, sender = alex) => ({ _id: id, content, chat, sender, createdAt: '2026-10-20T10:00:00Z' });
let failLoad = false;
let failSend = false;
let slowA = true;
let sent = 0;
let avatarRequests = 0;
let expired = false;
let samRead = false;
const readRequests = [];
const savedMessages = [];
const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
await page.addInitScript((user) => { localStorage.setItem('chime_user', JSON.stringify(user)); localStorage.setItem('chime_token', 'test'); }, me);
await page.route('**/socket.io/**', (route) => route.abort());
await page.route('**/api/**', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return route.continue();
  if (url.pathname.includes('upload-avatar')) avatarRequests++;
  if (url.pathname === '/api/chat') return expired ? fulfill(route, { message: 'Invalid token' }, 401) : fulfill(route, chats);
  if (url.pathname.endsWith('/read') || url.pathname.endsWith('/delivered')) {
    const { messageIds } = request.postDataJSON();
    if (url.pathname.endsWith('/read')) readRequests.push(...messageIds);
    return fulfill(route, { chatId: url.pathname.split('/')[3], messageIds, userId: me._id, kind: url.pathname.endsWith('/read') ? 'read' : 'delivered' });
  }
  if (url.pathname === '/api/user') return fulfill(route, [alex, sam]);
  if (url.pathname === '/api/message' && request.method() === 'POST') {
    if (failSend) return fulfill(route, { message: 'Test send failure' }, 500);
    const body = request.postDataJSON();
    const saved = message(`sent-${++sent}`, body.content, body.chatId, me);
    savedMessages.push(saved);
    return fulfill(route, saved);
  }
  if (url.pathname === '/api/message/a') {
    if (slowA) await new Promise((resolve) => setTimeout(resolve, 900));
    return fulfill(route, Array.from({ length: 60 }, (_, i) => message(`a${i}`, `Alex conversation only ${i}`, 'a')));
  }
  if (url.pathname === '/api/message/b') {
    if (failLoad) return fulfill(route, { message: 'Test loading failure' }, 500);
    return fulfill(route, [message('b1', 'Sam conversation only', 'b', sam), ...savedMessages.map((m) => ({ ...m, readBy: samRead ? ['sam'] : [] }))]);
  }
  return fulfill(route, {});
});
try {
  await page.goto(process.env.CHIME_TEST_URL || 'http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
  const select = (name) => page.getByRole('button', { name: new RegExp(name) }).first().click();
  await select('Alex Morgan');
  await select('Sam Rivera');
  await page.getByText('Sam conversation only', { exact: true }).waitFor();
  await page.waitForTimeout(1100);
  assert.equal(await page.getByText(/^Alex conversation only/).count(), 0, 'Slow chat A must not overwrite chat B');
  assert.ok(readRequests.includes('b1'), 'Visible incoming messages should be marked read');
  assert.equal(await page.getByAltText('Jamie profile picture').first().getAttribute('src'), '/default-avatar.svg');
  await page.waitForFunction(() => [...document.querySelectorAll('img[alt="Sam Rivera profile picture"]')].every((img) => img.getAttribute('src') === '/default-avatar.svg'));
  slowA = false;
  const input = page.getByRole('textbox', { name: 'Message', exact: true });
  await page.locator('input[type=file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5ioAAAAASUVORK5CYII=', 'base64') });
  await page.getByAltText('Image ready to send').waitFor();
  assert.equal(avatarRequests, 0, 'Attaching an image must not update the avatar');
  await page.getByRole('button', { name: 'Remove image' }).click();
  await input.fill('Draft for Sam');
  await select('Alex Morgan');
  assert.equal(await input.inputValue(), '', 'Draft must not leak to another chat');
  await page.getByText('Alex conversation only 59', { exact: true }).waitFor();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const readsBeforeHidden = readRequests.length;
  await page.waitForTimeout(1000);
  assert.equal(readRequests.length, readsBeforeHidden, 'Hidden chats must not mark messages read');
  await page.evaluate(() => {
    delete document.visibilityState;
    delete document.hasFocus;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1000);
  assert.ok(readRequests.includes('a59'), 'The visible end of a conversation should be marked read');
  assert.equal(readRequests.includes('a0'), false, 'Offscreen history must not be marked read');
  const history = page.getByLabel('Conversation messages');
  await history.evaluate((node) => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
  await input.fill('Reading older history');
  assert.equal(await history.evaluate((node) => node.scrollTop), 0, 'Typing must not jump away from older messages');
  await select('Sam Rivera');
  assert.equal(await input.inputValue(), 'Draft for Sam');
  failSend = true;
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Message not sent' }).waitFor();
  assert.equal(await input.inputValue(), 'Draft for Sam');
  failSend = false;
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.getByText('Draft for Sam', { exact: true }).waitFor();
  assert.equal(sent, 1);
  await page.getByLabel('Sent', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('Sent', { exact: true }).count(), 1);
  assert.equal(await page.getByLabel('Read', { exact: true }).count(), 0);
  samRead = true;
  await page.waitForFunction(() => !document.querySelector('textarea')?.disabled);
  await input.fill('First line');
  await input.press('Shift+Enter');
  await input.press('End');
  await input.type('Second line');
  assert.match(await input.inputValue(), /\n/);
  failLoad = true;
  await select('Alex Morgan');
  await select('Sam Rivera');
  await page.getByRole('alert').filter({ hasText: 'Something went wrong on our end' }).waitFor();
  assert.equal(await page.getByText('Sam conversation only', { exact: true }).count(), 1, 'Cached history survives a failed refresh');
  failLoad = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Something went wrong on our end' }).waitFor({ state: 'hidden' });
  await page.getByLabel('Read', { exact: true }).waitFor();
  assert.match(await page.getByLabel('Read', { exact: true }).getAttribute('class'), /text-sky-400/);
  await page.getByRole('button', { name: 'New Conversation', exact: true }).click();
  await page.getByRole('dialog', { name: 'New conversation' }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.screenshot({ path: process.env.CHIME_SCREENSHOT || 'tests/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Mobile must not overflow horizontally');
  const bounds = await input.boundingBox();
  assert.ok(bounds.y + bounds.height <= 844, 'Composer must fit inside mobile viewport');
  await page.screenshot({ path: process.env.CHIME_MOBILE_SCREENSHOT || 'tests/mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to Chats' }).click();
  expired = true;
  await page.getByRole('button', { name: 'Refresh conversations' }).click();
  await page.getByRole('heading', { name: /Welcome back/ }).waitFor();
  await page.getByText('Your session has expired. Please sign in again to continue.', { exact: true }).waitFor();
  assert.equal(await page.getByText('Invalid token', { exact: true }).count(), 0);
  assert.deepEqual(errors, [], 'No uncaught rendering errors');
  console.log('PASS: chat request race, separate drafts, failed send recovery, multiline entry, cached history, retry, dialog Escape, attachments, history scrolling, mobile layout, session expiry, read receipts, default avatars, no rendering errors');
} catch (error) {
  console.log(await page.locator('body').innerText());
  await page.screenshot({ path: 'tests/failure.png' });
  throw error;
} finally {
  await browser.close();
}

