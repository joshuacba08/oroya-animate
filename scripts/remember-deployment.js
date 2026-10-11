import { readFileSync, appendFileSync } from 'node:fs';
// CLI inspect resolves the public alias to the deployment currently serving it.
const result = JSON.parse(readFileSync('previous-deployment.json', 'utf8'));
const deployment = result.deployment ?? result;
if (!/^dpl_[A-Za-z0-9]+$/.test(deployment.id ?? '')) {
  throw new Error('Cannot identify current production deployment; refusing promotion without a rollback target');
}
if (deployment.projectId && deployment.projectId !== process.env.VERCEL_PROJECT_ID) {
  throw new Error('Production alias belongs to a different project');
}
if (!process.env.GITHUB_OUTPUT) throw new Error('Expected GitHub Actions output file');
appendFileSync(process.env.GITHUB_OUTPUT, 'id=' + deployment.id + '\n');
console.log('Captured the current production deployment for rollback.');
