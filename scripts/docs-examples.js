// Markdown can explicitly group a tutorial's successive steps into one program.
// Standalone blocks need imports, setup and a consumer; setup fragments are skipped.
export function extractExamples(text) {
  text = text.replace(/\r\n/g, "\n");
  const examples = [];
  const groups = [...text.matchAll(/^<!-- docs-example:start -->\n([\s\S]*?)^<!-- docs-example:end -->$/gm)];
  const fences = (body) => [...body.matchAll(/\x60{3}(ts|typescript|tsx)(?: (complete))?\n([\s\S]*?)\x60{3}/g)];
  for (const group of groups) {
    const blocks = fences(group[1]);
    if (!blocks.length) throw new Error('Empty docs-example group');
    examples.push({ code: blocks.map((block) => block[3]).join('\n'), jsx: blocks.some((block) => block[1] === 'tsx') });
  }
  const remaining = text.replace(/^<!-- docs-example:start -->\n[\s\S]*?^<!-- docs-example:end -->$/gm, '');
  for (const block of fences(remaining)) {
    const code = block[3];
    const setup = /const scene = new Scene\(|const result = await loadGLTF\(/.test(code);
    const consumer = /\b(?:\w+\.mount|renderToSVG|renderToCanvas|serialize)\(/.test(code);
    if (block[2] || (/^import /m.test(code) && setup && consumer)) {
      examples.push({ code, jsx: block[1] === 'tsx' });
    }
  }
  return examples;
}
