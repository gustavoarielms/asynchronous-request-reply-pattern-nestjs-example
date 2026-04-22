import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const shouldStartApp = process.env.START_APP !== 'false';
const requestedPort = Number(process.env.PORT ?? (shouldStartApp ? 3100 : 3100));
let appPort = requestedPort;
let appUrl = process.env.APP_URL ?? `http://127.0.0.1:${appPort}`;
const startupTimeoutMs = Number(process.env.STARTUP_TIMEOUT_MS ?? 15000);
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 250);
const terminalTimeoutMs = Number(process.env.TERMINAL_TIMEOUT_MS ?? 30000);

let appProcess;

function fail(message) {
  throw new Error(message);
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
      const response = await fetch(`${appUrl}/consumer-status/status/non-existent-job`);
      if (response.status === 404) {
        return;
      }
    } catch {
      // App is not ready yet.
    }

    await delay(250);
  }

  fail(`Package consumer app did not become ready within ${startupTimeoutMs}ms`);
}

async function createJob(data) {
  const response = await fetch(`${appUrl}/consumer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

  return {
    httpStatus: response.status,
    payload: await response.json(),
  };
}

async function assertImmediateStatus(location) {
  const status = await getStatus(location);

  if (status.httpStatus !== 200) {
    fail(`Expected immediate 200 from ${location}, got ${status.httpStatus}`);
  }

  return status.payload;
}

async function waitForTerminal(location) {
  const deadline = Date.now() + terminalTimeoutMs;
  const seenStates = new Set();

  while (Date.now() < deadline) {
    const status = await getStatus(location);

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
  const location = await createJob({ name: 'consumer-success', milliseconds: 200 });
  await assertImmediateStatus(location);
  const { payload } = await waitForTerminal(location);

  if (payload.status !== 'completed') {
    fail(`Expected completed status, got ${JSON.stringify(payload)}`);
  }

  if (payload.result !== 'Consumer processed: consumer-success') {
    fail(`Unexpected success result: ${JSON.stringify(payload)}`);
  }
}

async function assertFailureCase() {
  const location = await createJob({ name: 'fail:consumer', milliseconds: 200 });
  await assertImmediateStatus(location);
  const { payload } = await waitForTerminal(location);

  if (payload.status !== 'failed') {
    fail(`Expected failed status, got ${JSON.stringify(payload)}`);
  }

  if (payload.result !== 'Simulated package consumer failure for fail:consumer') {
    fail(`Unexpected failure result: ${JSON.stringify(payload)}`);
  }
}

async function assertLongRunningCase() {
  const location = await createJob({ name: 'consumer-long', milliseconds: 8000 });
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
    appPort = requestedPort;
    appUrl = process.env.APP_URL ?? `http://127.0.0.1:${appPort}`;

    appProcess = spawn('npm', ['run', 'start:package-consumer'], {
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
    process.stdout.write('Package consumer smoke test passed\n');
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
