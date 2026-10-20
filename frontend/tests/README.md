# Frontend regression checks

Start the frontend with `npm run dev`, then run `node tests/chat-regression.mjs` from `frontend` with Playwright installed. The default browser is Microsoft Edge; set `CHIME_BROWSER=chrome` to use Chrome. `PLAYWRIGHT_MODULE` optionally points to an existing Playwright module (use a file URL on Windows). `CHIME_TEST_URL` defaults to http://127.0.0.1:5173.

The test uses a disposable browser profile and mocked API data. It checks delayed message responses, cached history on failed refresh, retry, separate drafts, failed send recovery, multiline input, image attachments, history scrolling, dialog Escape, mobile viewport fit, sign-out and rendering errors. Desktop and mobile screenshots are generated locally and ignored by Git.

Live two-user socket delivery and backend cold-start latency still need a connected staging environment.
