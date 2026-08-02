import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/;

export function findMutableActionReferences(fileName, contents) {
  const violations = [];

  for (const [index, line] of contents.split('\n').entries()) {
    const match = line.match(/^\s*(?:-\s*)?uses:\s*['"]?([^'"\s#]+)['"]?/);
    if (!match) {
      continue;
    }

    const reference = match[1];
    if (reference.startsWith('./') || reference.startsWith('docker://')) {
      continue;
    }

    const separator = reference.lastIndexOf('@');
    const revision = separator === -1 ? '' : reference.slice(separator + 1);
    if (!FULL_COMMIT_SHA.test(revision)) {
      violations.push(`${fileName}:${index + 1}: ${reference}`);
    }
  }

  return violations;
}

export async function scanWorkflowDirectory(workflowDirectory, rootDirectory) {
  const workflowFiles = (await readdir(workflowDirectory))
    .filter((fileName) => /\.ya?ml$/.test(fileName))
    .sort();
  const violations = [];

  for (const fileName of workflowFiles) {
    const absolutePath = path.join(workflowDirectory, fileName);
    const displayPath = path.relative(rootDirectory, absolutePath);
    const contents = await readFile(absolutePath, 'utf8');
    violations.push(...findMutableActionReferences(displayPath, contents));
  }

  return violations;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const repositoryRoot = path.resolve(path.dirname(scriptPath), '..');
  const violations = await scanWorkflowDirectory(
    path.join(repositoryRoot, '.github', 'workflows'),
    repositoryRoot,
  );

  if (violations.length > 0) {
    console.error('Mutable GitHub Action references found:');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exitCode = 1;
  } else {
    console.log('All GitHub Actions are pinned to full commit SHAs.');
  }
}
