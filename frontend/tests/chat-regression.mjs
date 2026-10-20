const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true, channel: process.env.CHIME_BROWSER || 'msedge' });
const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') console.log('Browser:', msg.text()); });
page.on('requestfailed', (req) => console.log('Request failed:', req.url(), req.failure()?.errorText));
page.on('pageerror', (error) => { errors.push(error.message); console.error(error.message); });
page.setDefaultTimeout(10000);
const me = { _id: 'me', name: 'Jamie', email: 'jamie@example.test' };
const alex = { _id: 'alex', name: 'Alex Morgan', email: 'alex@example.test' };
const sam = { _id: 'sam', name: 'Sam Rivera', email: 'sam@example.test' };
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
const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
await page.addInitScript((user) => { localStorage.setItem('chime_user', JSON.stringify(user)); localStorage.setItem('chime_token', 'test'); }, me);
await page.route('**/socket.io/**', (route) => route.abort());
await page.route('**/api/**', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return route.continue();
  if (url.pathname.includes('upload-avatar')) avatarRequests++;
  if (url.pathname === '/api/chat') return fulfill(route, chats);
  if (url.pathname === '/api/user') return fulfill(route, [alex, sam]);
  if (url.pathname === '/api/message' && request.method() === 'POST') {
    if (failSend) return fulfill(route, { message: 'Test send failure' }, 500);
    const body = request.postDataJSON();
    return fulfill(route, message(`sent-${++sent}`, body.content, body.chatId, me));
  }
  if (url.pathname === '/api/message/a') {
    if (slowA) await new Promise((resolve) => setTimeout(resolve, 900));
    return fulfill(route, Array.from({ length: 60 }, (_, i) => message(`a${i}`, `Alex conversation only ${i}`, 'a')));
  }
  if (url.pathname === '/api/message/b') {
    if (failLoad) return fulfill(route, { message: 'Test loading failure' }, 500);
    return fulfill(route, [message('b1', 'Sam conversation only', 'b', sam)]);
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
  await page.waitForFunction(() => !document.querySelector('textarea')?.disabled);
  await input.fill('First line');
  await input.press('Shift+Enter');
  await input.press('End');
  await input.type('Second line');
  assert.match(await input.inputValue(), /\n/);
  failLoad = true;
  await select('Alex Morgan');
  await select('Sam Rivera');
  await page.getByRole('alert').filter({ hasText: 'Test loading failure' }).waitFor();
  assert.equal(await page.getByText('Sam conversation only', { exact: true }).count(), 1, 'Cached history survives a failed refresh');
  failLoad = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Test loading failure' }).waitFor({ state: 'hidden' });
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
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.getByRole('heading', { name: /Welcome back/ }).waitFor();
  assert.deepEqual(errors, [], 'No uncaught rendering errors');
  console.log('PASS: chat request race, separate drafts, failed send recovery, multiline entry, cached history, retry, dialog Escape, attachments, history scrolling, mobile layout, sign-out, no rendering errors');
} catch (error) {
  console.log(await page.locator('body').innerText());
  await page.screenshot({ path: 'tests/failure.png' });
  throw error;
} finally {
  await browser.close();
}

