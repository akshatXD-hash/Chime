import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { startLocalServer, api } from '../../backend/tests/localServer.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await startLocalServer();
let browser;
let vite;
try {
  const signup = (name) => api(server.url, '/api/auth/signup', { method: 'POST', body: { name, email: `${name.toLowerCase()}@example.test`, password: 'test-pass-123' } });
  const alice = await signup('Alice');
  const bob = await signup('Bob');
  const chat = await api(server.url, '/api/chat', { token: alice.token, method: 'POST', body: { userId: bob.user._id } });
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, VITE_API_URL: server.url, VITE_SOCKET_URL: server.url },
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite did not start')), 20000);
    vite.stdout.on('data', (chunk) => { if (String(chunk).includes('Local:')) { clearTimeout(timer); resolve(); } });
    vite.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Vite exited: ${code}`)); });
    vite.stderr.on('data', (chunk) => process.stderr.write(chunk));
  });
  browser = await chromium.launch({ headless: true, channel: process.env.CHIME_BROWSER || 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const a = await context.newPage();
  const b = await context.newPage();
  const errors = [];
  for (const page of [a, b]) {
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    page.on('pageerror', (error) => errors.push(error.message));
  }
  const signIn = async (page, name) => {
    await page.locator('input[type=email]').fill(`${name.toLowerCase()}@example.test`);
    await page.locator('input[type=password]').fill('test-pass-123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.getByRole('button', { name: `Your profile: ${name}`, exact: true }).waitFor();
  };
  const row = (page, text) => page.locator('[data-message-id]').filter({ has: page.getByText(text, { exact: true }) });
  const send = async (page, text) => {
    await page.bringToFront();
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill(text);
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await row(page, text).waitFor();
  };
  await a.goto('http://127.0.0.1:5174', { waitUntil: 'domcontentloaded' });
  await signIn(a, 'Alice');
  await a.getByRole('button', { name: /^Bob / }).click();
  await b.goto('http://127.0.0.1:5174', { waitUntil: 'domcontentloaded' });
  await b.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await signIn(b, 'Bob');
  assert.equal(await a.getByRole('button', { name: 'Your profile: Alice', exact: true }).count(), 1);
  await context.addCookies([{ name: 'token', value: bob.token, domain: '127.0.0.1', path: '/', httpOnly: true }]);
  await send(a, 'Hello from Alice');
  await row(a, 'Hello from Alice').getByLabel('Delivered', { exact: true }).waitFor();
  assert.equal(await row(a, 'Hello from Alice').getAttribute('data-direction'), 'outgoing');
  assert.equal(await row(a, 'Hello from Alice').getByLabel('Read', { exact: true }).count(), 0);
  await b.bringToFront();
  await b.getByRole('button', { name: /^Alice / }).click();
  await row(b, 'Hello from Alice').waitFor();
  assert.equal(await row(b, 'Hello from Alice').getAttribute('data-direction'), 'incoming');
  await row(a, 'Hello from Alice').getByLabel('Read', { exact: true }).waitFor();
  await send(b, 'Hello from Bob');
  await row(a, 'Hello from Bob').waitFor();
  assert.equal(await row(a, 'Hello from Bob').getAttribute('data-direction'), 'incoming');
  assert.equal(await row(b, 'Hello from Bob').getAttribute('data-direction'), 'outgoing');
  await a.bringToFront();
  await row(b, 'Hello from Bob').getByLabel('Read', { exact: true }).waitFor();
  await send(a, 'Yes, I can tell who sent each message now.');
  await b.bringToFront();
  await row(a, 'Yes, I can tell who sent each message now.').getByLabel('Read', { exact: true }).waitFor();
  await send(b, 'First line\nSecond line  with  spaces');
  await row(a, 'First line\nSecond line  with  spaces').waitFor();
  await a.bringToFront();
  await row(b, 'First line\nSecond line  with  spaces').getByLabel('Read', { exact: true }).waitFor();
  const history = await api(server.url, `/api/message/${chat._id}`, { token: alice.token });
  assert.equal(history.length, 4);
  assert.deepEqual(history.map((message) => message.sender._id), [alice.user._id, bob.user._id, alice.user._id, bob.user._id]);
  assert.ok(history.every((message) => message.readBy.length === 1));
  for (const page of [a, b]) {
    assert.equal(await page.locator('[data-message-id]').count(), 4, 'Socket echoes must not duplicate a message');
    await page.reload();
    await page.locator('[data-message-id]').nth(3).waitFor();
    assert.equal(await page.locator('[data-direction=outgoing]').count(), 2);
    assert.equal(await page.locator('[data-direction=incoming]').count(), 2);
    assert.equal(await page.getByLabel('Read', { exact: true }).count(), 2);
  }
  await a.bringToFront();
  const incoming = await row(a, 'Hello from Bob').locator('.bubble-incoming').boundingBox();
  const outgoing = await row(a, 'Hello from Alice').locator('.bubble-outgoing').boundingBox();
  assert.ok(outgoing.x > incoming.x + 100, 'Sender sides must be clearly separated');
  assert.ok(await row(a, 'Hello from Bob').evaluate((node) => parseFloat(getComputedStyle(node).marginTop) >= 24));
  await a.screenshot({ path: 'tests/two-accounts-desktop.png', fullPage: true });
  await a.setViewportSize({ width: 390, height: 844 });
  assert.equal(await a.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await a.screenshot({ path: 'tests/two-accounts-mobile.png', fullPage: true });
  await b.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await a.setViewportSize({ width: 1365, height: 900 });
  await a.reload();
  await a.getByRole('button', { name: 'Your profile: Alice', exact: true }).waitFor({ state: 'attached' });
  await a.locator('[data-message-id]').nth(3).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: two accounts in shared-storage tabs, real login, wrong shared cookie, separate senders, live grey/blue ticks, reply spacing, multiline content, reload persistence, mobile layout and independent logout');
} finally {
  await browser?.close();
  if (vite && vite.exitCode === null) { const exited = once(vite, 'exit'); vite.kill(); await exited; }
  await server.stop();
}
