import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

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
  const parsedWorkflow = yaml.load(workflow);

  assert.deepEqual(Object.keys(parsedWorkflow.on), ['release']);
  assert.deepEqual(parsedWorkflow.on.release.types, ['published']);
});
