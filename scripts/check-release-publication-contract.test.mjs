import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

test('release-please creates a tagged draft GitHub Release', async () => {
  const config = JSON.parse(
    await readFile(
      path.join(repositoryRoot, 'release-please-config.json'),
      'utf8',
    ),
  );

  assert.equal(config.packages?.['.']?.draft, true);
  assert.equal(config.packages?.['.']?.['force-tag-creation'], true);
});

test('npm publication depends only on a published GitHub Release', async () => {
  const workflow = await readFile(
    path.join(repositoryRoot, '.github', 'workflows', 'publish-package.yml'),
    'utf8',
  );
  const lines = workflow.split('\n');
  const onLine = lines.indexOf('on:');
  const nextTopLevelKey = lines.findIndex(
    (line, index) => index > onLine && /^[^\s#][^:]*:/.test(line),
  );
  const endOfOnBlock = nextTopLevelKey === -1 ? lines.length : nextTopLevelKey;
  const triggerLines = lines
    .slice(onLine + 1, endOfOnBlock)
    .filter((line) => line.trim() && !line.trimStart().startsWith('#'));

  assert.notEqual(onLine, -1, 'publish workflow must declare an on block');
  assert.deepEqual(
    triggerLines,
    ['  release:', '    types:', '      - published'],
    'publish workflow must run only for a published GitHub Release',
  );
});
