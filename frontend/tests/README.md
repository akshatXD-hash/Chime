# Messaging regression checks

Run the fast checks from the repository root:

```sh
npm test --prefix backend
npm test --prefix frontend
npm run build --prefix frontend
```

The unit tests cover bearer-token precedence over shared cookies, tab-specific sessions, membership checks, receipt batches, group read status, early socket echoes, monotonic receipts, and user-facing errors.

## Real backend and database

```sh
npm run test:integration --prefix backend
```

This starts the real Express and Socket.IO server against a temporary local MongoDB database. The helper overrides DATABASE_URL and JWT_SECRET for the child process, so it never uses the configured production database. It creates disposable accounts and checks sender identity, delivery/read events, persistence, multi-tab presence, offline history, group receipts, and rejected outsider access. The server and temporary database are removed when the test exits normally, including assertion failures.

MongoDB is a test-only development dependency. Ordinary npm installation has its automatic MongoDB download disabled. The first integration run downloads MongoDB 7.0.14 if it is unavailable (about 592 MB on Windows); subsequent runs reuse backend/node_modules/.cache/mongodb-binaries. MONGOMS_SYSTEM_BINARY can point to an existing compatible binary. The cached executable remains after tests, but the temporary database does not. No system service is installed.

## Browser checks

Install Playwright in your development environment, or set PLAYWRIGHT_MODULE to an existing module (a file URL on Windows). Microsoft Edge is the default browser; CHIME_BROWSER=chrome selects Chrome.

```sh
npm run test:integration --prefix frontend
```

The real browser integration starts its own backend, temporary MongoDB, and Vite on 127.0.0.1:5174. It signs Alice and Bob into two tabs sharing localStorage and cookies. It checks alternating sender ownership, opposite bubble sides, spacing, grey delivery ticks, blue read ticks, multiline text, persistence across reload, independent logout, and the mobile viewport. Desktop/mobile screenshots are saved under frontend/tests and ignored by Git. This test uses the same optional MongoDB download described above.

For failure and race scenarios, start Vite separately with `npm run dev --prefix frontend -- --host 127.0.0.1`, then run:

```sh
npm run test:browser --prefix frontend
```

CHIME_TEST_URL defaults to http://127.0.0.1:5173. This suite mocks the API and deliberately blocks sockets. It checks delayed responses, cached history during failed refresh, retry, draft isolation, failed-send recovery, attachments, scrolling, dialog Escape, session expiry, missing/broken avatars, and rendering errors. Expected simulated network and server errors appear in its console output.

## Receipt behavior and release

A single grey tick means the server saved the message. Two grey ticks mean all other current chat members acknowledged delivery. Two blue ticks mean all those members viewed the message. Read acknowledgement requires a visible, focused chat and a message inside its viewport. Existing receipts survive refreshes and out-of-order socket events.

Release the frontend and backend together: the frontend uses authenticated sockets and the delivery/read endpoints. These changes add optional receipt and client-message fields; no migration is required. Older messages without receipts acquire them when recipients load/view the chat. Messages already saved under the wrong sender by the former shared-cookie bug cannot be safely reassigned automatically.

Local integration checks do not measure the deployed hosting provider's cold starts or production network latency.
