import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const shouldStartApp = process.env.START_APP !== 'false';
const requestedPort = Number(process.env.PORT ?? (shouldStartApp ? 3100 : 3000));
let appPort = requestedPort;
let appUrl = process.env.APP_URL ?? `http://127.0.0.1:${appPort}`;
const startupTimeoutMs = Number(process.env.STARTUP_TIMEOUT_MS ?? 15000);
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 250);
const terminalTimeoutMs = Number(process.env.TERMINAL_TIMEOUT_MS ?? 30000);

let appProcess;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  throw new Error(message);
}

async function getAvailablePort(preferredPort) {
  const server = net.createServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(preferredPort, resolve);
  }).catch(async () => {
    await new Promise((resolve, reject) => {
      server.removeAllListeners('error');
      server.once('error', reject);
      server.listen(0, resolve);
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    fail('Unable to determine an available port for the smoke test');
  }

  const { port } = address;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

function waitForExit(childProcess, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(false);
      }
    }, timeoutMs);

    childProcess.once('exit', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(true);
      }
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + startupTimeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${appUrl}/async-status/status/non-existent-job`);
      if (response.status === 404) {
        return;
      }
    } catch {
      // App is not ready yet.
    }

    await delay(250);
  }

  fail(`App did not become ready within ${startupTimeoutMs}ms`);
}

async function createJob(data) {
  const response = await fetch(`${appUrl}/async/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });

  if (response.status !== 202) {
    fail(`Expected 202 Accepted, got ${response.status}`);
  }

  const payload = await response.json();

  if (payload.status !== 'accepted' || typeof payload.location !== 'string') {
    fail(`Unexpected accepted payload: ${JSON.stringify(payload)}`);
  }

  return payload.location;
}

async function getStatus(location) {
  const response = await fetch(`${appUrl}${location}`);

  if (response.status === 404) {
    return { httpStatus: 404 };
  }

  const payload = await response.json();
  return { httpStatus: response.status, payload };
}

async function assertImmediateStatus(location) {
  const status = await getStatus(location);

  if (status.httpStatus === 404) {
    fail(`Expected ${location} to be visible immediately after 202 Accepted`);
  }

  if (status.httpStatus !== 200) {
    fail(`Unexpected immediate status code ${status.httpStatus} for ${location}`);
  }

  return status.payload;
}

async function waitForTerminal(location) {
  const deadline = Date.now() + terminalTimeoutMs;
  const seenStates = new Set();

  while (Date.now() < deadline) {
    const status = await getStatus(location);

    if (status.httpStatus === 404) {
      seenStates.add('not-found');
      await delay(pollIntervalMs);
      continue;
    }

    if (status.httpStatus !== 200) {
      fail(`Unexpected status code ${status.httpStatus} for ${location}`);
    }

    const payload = status.payload;
    seenStates.add(payload.status);

    if (payload.completed) {
      return { payload, seenStates };
    }

    await delay(pollIntervalMs);
  }

  fail(`Job at ${location} did not reach a terminal state within ${terminalTimeoutMs}ms`);
}

async function assertSuccessCase() {
  const location = await createJob({ name: 'smoke-success', milliseconds: 200 });
  await assertImmediateStatus(location);
  const { payload } = await waitForTerminal(location);

  if (payload.status !== 'completed') {
    fail(`Expected completed status, got ${JSON.stringify(payload)}`);
  }

  if (payload.result !== 'Processed data: smoke-success') {
    fail(`Unexpected success result: ${JSON.stringify(payload)}`);
  }
}

async function assertFailureCase() {
  const location = await createJob({ name: 'fail:smoke', milliseconds: 200 });
  await assertImmediateStatus(location);
  const { payload } = await waitForTerminal(location);

  if (payload.status !== 'failed') {
    fail(`Expected failed status, got ${JSON.stringify(payload)}`);
  }

  if (payload.result !== 'Simulated example failure for fail:smoke') {
    fail(`Unexpected failure result: ${JSON.stringify(payload)}`);
  }
}

async function assertLongRunningCase() {
  const location = await createJob({ name: 'smoke-long', milliseconds: 8000 });
  await assertImmediateStatus(location);
  const { payload, seenStates } = await waitForTerminal(location);
  const sawInProgress = seenStates.has('waiting') || seenStates.has('active');

  if (!sawInProgress) {
    fail(`Expected to observe an in-progress state before completion, saw: ${JSON.stringify([...seenStates])}`);
  }

  if (payload.status !== 'completed') {
    fail(`Expected completed status for long-running job, got ${JSON.stringify(payload)}`);
  }
}

async function run() {
  if (shouldStartApp) {
    appPort = await getAvailablePort(requestedPort);
    appUrl = process.env.APP_URL ?? `http://127.0.0.1:${appPort}`;

    appProcess = spawn('npm', ['run', 'start:prod'], {
      env: {
        ...process.env,
        PORT: String(appPort),
      },
      stdio: 'inherit',
    });
  }

  try {
    await waitForServer();
    await assertSuccessCase();
    await assertFailureCase();
    await assertLongRunningCase();
    log('Smoke test passed');
  } finally {
    if (appProcess) {
      appProcess.kill('SIGTERM');
      const exited = await waitForExit(appProcess, 1000);
      if (!exited) {
        appProcess.kill('SIGKILL');
        await waitForExit(appProcess, 1000);
      }
    }
  }
}

run().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
