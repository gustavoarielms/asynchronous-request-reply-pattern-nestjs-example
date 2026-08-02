import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  findMutableActionReferences,
  scanWorkflowDirectory,
} from './check-workflow-action-pins.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

test('rejects a mutable GitHub Action tag', () => {
  assert.deepEqual(
    findMutableActionReferences(
      'example.yml',
      'steps:\n  - uses: actions/checkout@v6.0.3\n',
    ),
    ['example.yml:2: actions/checkout@v6.0.3'],
  );
});

test('accepts an Action pinned to a full commit SHA', () => {
  assert.deepEqual(
    findMutableActionReferences(
      'example.yml',
      'steps:\n  - uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6.0.3\n',
    ),
    [],
  );
});

test('all repository workflows pin GitHub Actions', async () => {
  assert.deepEqual(
    await scanWorkflowDirectory(
      path.join(repositoryRoot, '.github', 'workflows'),
      repositoryRoot,
    ),
    [],
  );
});
