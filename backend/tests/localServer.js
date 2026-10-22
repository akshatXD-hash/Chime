import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

export async function startLocalServer() {
  const mongo = await MongoMemoryServer.create({ binary: { version: process.env.MONGOMS_VERSION || '7.0.14', downloadDir: process.env.MONGOMS_DOWNLOAD_DIR || fileURLToPath(new URL('../node_modules/.cache/mongodb-binaries', import.meta.url)) } });
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(process.execPath, ['index.js'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, PORT: String(port), DATABASE_URL: mongo.getUri('chime_test'), JWT_SECRET: 'local-integration-test-secret', NODE_ENV: 'test' },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    await mongo.stop();
  };
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Local backend did not connect to its test database')), 30000);
      child.stdout.on('data', (chunk) => {
        if (String(chunk).includes('database connected')) { clearTimeout(timeout); resolve(); }
      });
      child.once('error', (err) => { clearTimeout(timeout); reject(err); });
      child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Local backend exited: ${code}`)); });
      child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    });
    return { url: `http://127.0.0.1:${port}`, stop };
  } catch (err) { await stop(); throw err; }
}

export async function api(url, path, { token, method = 'GET', body, cookie } = {}) {
  const response = await fetch(url + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.message}`);
  return data;
}
