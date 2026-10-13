import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
const id = process.argv[2]; const repository = process.env.GITHUB_REPOSITORY;
if (!/^\d+$/.test(id ?? '') || !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) throw new Error('A repository release run is required.');
const command = (name, args) => { const result = spawnSync(name, args, { encoding: 'utf8', windowsHide: true }); if (result.status !== 0) throw new Error(result.stderr); return result.stdout; };
const run = JSON.parse(command('gh', ['api', 'repos/' + repository + '/actions/runs/' + id]));
if (run.path !== '.github/workflows/publish.yml' || run.head_branch !== 'main' || !/^[a-f0-9]{40}$/.test(run.head_sha)) throw new Error('Only a validated main release can be retried.');
const jobs = JSON.parse(command('gh', ['api', 'repos/' + repository + '/actions/runs/' + id + '/jobs?per_page=100'])).jobs;
const expected = ['validate / react18', ...['ubuntu-latest', 'windows-latest'].flatMap((os) => [
  'validate / applications (' + os + ')', ...[18, 20, 24].map((node) => 'validate / libraries (' + os + ', ' + node + ')'),
])];
for (const name of expected) if (!jobs.some((job) => job.name === name && job.conclusion === 'success')) throw new Error('Validation did not pass: ' + name);
const publication = jobs.find((job) => job.name === 'publish');
if (!publication?.steps.some((step) => step.name === 'Candidate acceptance' && step.conclusion === 'success') ||
    !publication.steps.some((step) => step.name === 'Publish and verify every compatible package' && step.conclusion === 'failure')) throw new Error('This retry requires accepted candidate evidence and a failed publication step.');
const allowed = new Set(['scripts/publish-release.js', 'scripts/registry-version.js', 'scripts/check-release-retry.js',
  'scripts/tests/registry-version.test.ts', '.github/workflows/retry-release.yml', '.github/workflows/deploy-web.yml']);
const changes = command('git', ['diff', '--name-only', run.head_sha, 'HEAD']).trim().split('\n').filter(Boolean);
if (changes.some((file) => !allowed.has(file))) throw new Error('SDK or validation inputs changed since acceptance; run full release validation.');
appendFileSync(process.env.GITHUB_STEP_SUMMARY, 'Reusing all nine successful validation jobs and accepted candidate evidence from ' + run.html_url + '. SDK, lockfile, build configuration and browser tests are unchanged.\n');
console.log('Accepted retry from ' + run.head_sha + '; ' + changes.length + ' publication/deployment-only changes.');
