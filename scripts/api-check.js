import ts from 'typescript';
import { readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Audit the compiler's resolved public symbols, including aliases and star chains. */
export function auditExports(entries, options = {}) {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.base.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(entries, { ...parsed.options, composite: false, noEmit: true, jsx: ts.JsxEmit.ReactJSX, ...options });
  const checker = program.getTypeChecker();
  const findings = [];
  const visited = new Set();
  function checkModules(source) {
    if (visited.has(source.fileName)) return;
    visited.add(source.fileName);
    for (const statement of source.statements) {
      if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue;
      const module = checker.getSymbolAtLocation(statement.moduleSpecifier);
      if (!module) {
        findings.push({ kind: 'unresolved', file: source.fileName, name: statement.moduleSpecifier.text });
      } else {
        for (const declaration of module.declarations ?? []) {
          if (ts.isSourceFile(declaration)) checkModules(declaration);
        }
      }
    }
  }
  for (const entry of entries) {
    const source = program.getSourceFile(entry);
    if (!source) { findings.push({ kind: 'unresolved', file: entry, name: entry }); continue; }
    checkModules(source);
    const module = checker.getSymbolAtLocation(source);
    if (!module) continue;
    const seen = new Set();
    for (const exported of checker.getExportsOfModule(module)) {
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      // Multiple aliases of one declaration are reported once per package.
      if (seen.has(symbol)) continue;
      seen.add(symbol);
      const declaration = symbol.declarations?.[0];
      if (!declaration || symbol.name === 'unknown') {
        findings.push({ kind: 'unresolved', file: entry, name: exported.name }); continue;
      }
      let taggedDeclaration = declaration;
      if (ts.isVariableDeclaration(declaration)) taggedDeclaration = declaration.parent.parent;
      const tags = new Set([
        ...symbol.getJsDocTags(checker).map((tag) => tag.name),
        ...ts.getJSDocTags(taggedDeclaration).map((tag) => tag.tagName.text)
      ]);
      const file = declaration.getSourceFile();
      const line = file.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
      findings.push({ kind: tags.has('internal') ? 'internal' : ['public', 'experimental'].some((tag) => tags.has(tag)) ? 'ok' : 'missing',
        name: exported.name, declarationName: symbol.name, file: file.fileName, line, start: taggedDeclaration.getStart(), entry });
    }
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const entries = readdirSync(resolve(root, 'packages'))
    .map((pkg) => resolve(root, 'packages', pkg, 'src/index.ts')).filter(existsSync);
  const findings = auditExports(entries);
  const errors = findings.filter((item) => item.kind !== 'ok');
  if (process.argv.includes('--json')) console.log(JSON.stringify(findings));
  else {
    for (const item of errors) console.log(item.kind + ': ' + item.name + ' ← ' + item.file + ':' + (item.line ?? '?'));
    console.log(findings.length + ' resolved exports; ' + errors.length + ' policy/resolution failures.');
  }
  if (process.argv.includes('--strict') && errors.length) process.exitCode = 1;
}
