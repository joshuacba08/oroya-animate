import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import ts from 'typescript';

export function checkArchitecture(root = process.cwd()) {
  const failures = [];
  const visit = (directory, packageName) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) { visit(file, packageName); continue; }
      if (!/\.tsx?$/.test(file)) continue;
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const inspect = (node) => {
        let module;
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) module = node.moduleSpecifier;
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) module = node.argument.literal;
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require')) module = node.arguments[0];
        if (module && ts.isStringLiteral(module)) {
          const name = module.text;
          const allowed = packageName === 'core' ? name.startsWith('.') || name === 'uuid'
            : !name.startsWith('@joroya/') || name === '@joroya/core' || (['react', 'vue'].includes(packageName) && name === '@joroya/renderer-three');
          if (!allowed) failures.push(relative(root, file) + ': forbidden dependency ' + name);
          if (name.startsWith('.') && /(?:^|[\\/])(?:apps|renderer-three|renderer-svg|renderer-canvas2d|physics|loader-gltf)(?:[\\/]|$)/.test(name)) failures.push(relative(root, file) + ': cross-package relative import ' + name);
        }
        ts.forEachChild(node, inspect);
      };
      inspect(source);
    }
  };
  for (const entry of readdirSync(resolve(root, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = JSON.parse(readFileSync(resolve(root, 'packages', entry.name, 'package.json'), 'utf8'));
    if (entry.name === 'core' && Object.keys(manifest.dependencies ?? {}).some((name) => name !== 'uuid')) failures.push('core runtime dependencies must contain only uuid.');
    visit(resolve(root, 'packages', entry.name, 'src'), entry.name);
  }
  return failures;
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/architecture-check.js')) {
  const failures = checkArchitecture(); failures.forEach((value) => console.error(value));
  console.log('Architecture: ' + failures.length + ' violations.'); process.exitCode = failures.length ? 1 : 0;
}
