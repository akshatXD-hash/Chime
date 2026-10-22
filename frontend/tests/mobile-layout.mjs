import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.CHIME_BROWSER || 'msedge' });
const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(60000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const me = { _id: 'me', name: 'Jamie', email: 'jamie@example.test' };
const peer = { _id: 'peer', name: 'Alex Morgan with a very long display name', email: 'alex.with.a.long.address@example.test' };
const chat = { _id: 'chat', users: [me, peer] };
const messages = Array.from({ length: 30 }, (_, i) => ({
  _id: `m${i}`, chat: 'chat', sender: i % 2 ? me : peer,
  content: i === 28 ? 'LongMessage'.repeat(25) : `Message ${i}`,
  createdAt: '2026-10-22T10:00:00Z', readBy: ['peer'],
}));
let sent = 0;
await page.addInitScript((user) => {
  localStorage.setItem('chime_user', JSON.stringify(user));
  localStorage.setItem('chime_token', 'test');
}, me);
await page.route('**/socket.io/**', (route) => route.abort());
await page.route('**/api/**', (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (!path.startsWith('/api/')) return route.continue();
  let data = {};
  if (path === '/api/chat') data = [chat];
  else if (path === '/api/user') data = [peer];
  else if (path.endsWith('/read') || path.endsWith('/delivered')) {
    data = { chatId: 'chat', messageIds: request.postDataJSON().messageIds, userId: 'me', kind: path.endsWith('/read') ? 'read' : 'delivered' };
  } else if (path === '/api/message/chat') data = messages;
  else if (path === '/api/message' && request.method() === 'POST') {
    data = { _id: `sent${++sent}`, ...request.postDataJSON(), chat: 'chat', sender: me, createdAt: new Date().toISOString() };
    messages.push(data);
  }
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
});
const url = process.env.CHIME_TEST_URL || 'http://127.0.0.1:5173';
const fits = async (locator, height) => {
  const box = await locator.boundingBox();
  assert.ok(box && box.x >= -1 && box.y >= -1 && box.x + box.width <= (await page.viewportSize()).width + 1 && box.y + box.height <= height + 1, `Element is outside the viewport: ${JSON.stringify(box)}`);
};
const openChat = () => page.getByRole('button', { name: /^Alex Morgan/ }).click();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Your profile: Jamie' }).waitFor();
  await fits(page.locator('.mobile-nav'), 568);
  for (const name of ['New Conversation', 'Create Group Chat', 'Refresh conversations', 'Your profile: Jamie']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44, `${name} needs a finger-sized target`);
  }
  await openChat();
  await page.getByText('Message 29', { exact: true }).waitFor();
  const input = page.getByRole('textbox', { name: 'Message', exact: true });
  await fits(page.locator('.composer'), 568);
  assert.ok((await input.boundingBox()).width >= 160);
  await input.fill('First line');
  await input.press('Enter');
  assert.equal(sent, 0, 'Mobile Enter must not send');
  assert.match(await input.inputValue(), /\n/);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.getByText('First line', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Message options' }).click();
  await page.getByRole('button', { name: 'Choose emoji' }).click();
  await page.getByRole('region', { name: 'Emoji picker' }).locator('.EmojiPickerReact').waitFor();
  await fits(page.getByRole('region', { name: 'Emoji picker' }), 568);
  await page.getByRole('button', { name: 'Close emoji picker' }).click();
  await input.focus();
  await page.evaluate(() => {
    Object.defineProperty(visualViewport, 'height', { configurable: true, value: 320 });
    visualViewport.dispatchEvent(new Event('resize'));
  });
  await page.waitForFunction(() => document.querySelector('.app-shell').getBoundingClientRect().height === 320);
  await fits(page.locator('.composer'), 320);
  await page.waitForFunction(() => {
    const node = document.querySelector('.message-list');
    return node.scrollHeight - node.scrollTop - node.clientHeight < 5;
  });
  await page.locator('.message-list').evaluate((node) => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
  await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
  await page.waitForFunction(() => document.querySelector('.app-shell').getBoundingClientRect().height > 500);
  assert.equal(await page.locator('.message-list').evaluate((node) => node.scrollTop), 0, 'Resizing must preserve older-history reading');
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(size);
    await page.waitForFunction((height) => Math.abs(document.querySelector('.app-shell').getBoundingClientRect().height - height) < 2, size.height);
    await fits(page.locator('.composer'), size.height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Conversation Details', exact: true }).click();
    await fits(page.getByRole('dialog', { name: 'Conversation details' }), size.height);
    await page.getByRole('button', { name: 'Close conversation details' }).click();
    await page.screenshot({ path: `tests/mobile-${size.width}.png` });
  }
  await page.setViewportSize({ width: 320, height: 360 });
  await page.getByRole('button', { name: 'Back to Chats' }).click();
  for (const [button, dialog] of [['New Conversation', 'New conversation'], ['Create Group Chat', 'Create group'], ['Your profile: Jamie', 'Your profile']]) {
    await page.getByRole('button', { name: button, exact: true }).click();
    const sheet = page.getByRole('dialog', { name: dialog, exact: true });
    await fits(sheet, 360);
    if (dialog === 'Create group') {
      await sheet.getByPlaceholder('e.g. Engineering Team').fill('Phone group');
      await sheet.getByRole('button', { name: 'Create Group', exact: true }).scrollIntoViewIfNeeded();
      await fits(sheet.getByRole('button', { name: 'Create Group', exact: true }), 360);
    }
    await page.keyboard.press('Escape');
  }
  const authPage = await browser.newPage({ viewport: { width: 320, height: 360 }, isMobile: true, hasTouch: true });
  await authPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await authPage.getByRole('button', { name: 'Create Account', exact: true }).click();
  const create = authPage.getByRole('button', { name: 'Create Account', exact: true });
  await create.scrollIntoViewIfNeeded();
  const box = await create.boundingBox();
  assert.ok(box.y >= 0 && box.y + box.height <= 360);
  assert.equal(await authPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await authPage.screenshot({ path: 'tests/mobile-auth.png' });
  await authPage.close();
  assert.deepEqual(errors, []);
  console.log('PASS: phone/tablet/landscape layouts, touch targets, mobile Enter, emoji bounds, simulated keyboard resizing, history position, dialogs and short-screen registration');
} catch (error) {
  console.log(await page.locator('body').innerText());
  console.log(errors);
  await page.screenshot({ path: 'tests/mobile-failure.png' });
  throw error;
} finally {
  await browser.close();
}
