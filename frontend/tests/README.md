# Frontend regression checks

Start the frontend with `npm run dev`, then run `node tests/chat-regression.mjs` from `frontend` with Playwright installed. The default browser is Microsoft Edge; set `CHIME_BROWSER=chrome` to use Chrome. `PLAYWRIGHT_MODULE` optionally points to an existing Playwright module (use a file URL on Windows). `CHIME_TEST_URL` defaults to http://127.0.0.1:5173.

The test uses a disposable browser profile and mocked API data. It checks delayed message responses, cached history on failed refresh, retry, separate drafts, failed send recovery, multiline input, image attachments, history scrolling, dialog Escape, mobile viewport fit, sign-out and rendering errors. Desktop and mobile screenshots are generated locally and ignored by Git.

Live two-user socket delivery and backend cold-start latency still need a connected staging environment.

Run the isolated state and backend controller checks from the repository root with:

```sh
node --test backend/tests/readReceipts.test.js frontend/tests/message-state.test.mjs
```

Read-receipt checks cover recipient-only updates, chat membership, bounded request batches, group receipts, stale refreshes, visible versus offscreen messages, and simulated document visibility in a headless browser. Avatar checks cover missing and broken images; error checks cover session expiry and suppressed server diagnostics. The controller tests mock database calls. Live MongoDB persistence and two-user socket delivery still need a connected staging environment.

The frontend and backend read-receipt changes must be released together. Older messages without `readBy` remain unread until viewed; no data migration is needed.
