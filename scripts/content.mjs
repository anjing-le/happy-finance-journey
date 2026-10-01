import { readFile, readdir, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

marked.use({ renderer: { heading({ tokens, depth, text }) {
  const id = text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');
  return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
} } });
const base = process.env.BASE_PATH || '/';
const modules = ['knowledge', 'practices', 'activities'];
const pages = [];
const images = new Set();
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (entry.name.endsWith('.md')) pages.push(file);
  }
}
for (const dir of modules) await collect(dir);
pages.push('README.md');
pages.sort();
const route = file => file === 'README.md' ? 'about.html' : file.endsWith('/README.md') ? `read/${file.slice(0, -10)}/index.html` : `read/${file.slice(0, -3)}.html`;
const routes = new Map(pages.map(file => [file, route(file)]));
const moduleAnchors = { 'knowledge/README.md': 'knowledge', 'practices/README.md': 'practices', 'activities/README.md': 'activities' };
function html(markdown, source) {
  const tokens = marked.lexer(markdown);
  marked.walkTokens(tokens, token => {
    if (token.type !== 'link' && token.type !== 'image') return;
    if (/^(?:[a-z]+:|\/\/|#)/i.test(token.href)) return;
    const [file, hash] = token.href.split('#');
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), file));
    if (resolved.startsWith('../') || path.posix.isAbsolute(resolved)) throw new Error(`Asset outside repository: ${source}`);
    if (token.type === 'image') { images.add(resolved); token.href = `${base}content/${resolved}`; }
    else if (moduleAnchors[resolved] && !hash) token.href = `${base}#${moduleAnchors[resolved]}`;
    else if (routes.has(resolved)) token.href = `${base}${routes.get(resolved)}${hash ? '#' + hash : ''}`;
    else throw new Error(`Unresolved link: ${source} → ${token.href}`);
  });
  const output = marked.parser(tokens);
  return sanitizeHtml(output, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'], h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'] },
    transformTags: { img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async' } }) },
  });
}
const docs = [];
for (const file of pages) {
  const md = await readFile(file, 'utf8');
  const title = md.match(/^# (.+)$/m)?.[1] || '目标与维护规则';
  docs.push({ file, route: routes.get(file), title, html: html(md, file), module: file.split('/')[0] });
}
const knowledge = await readFile('knowledge/README.md', 'utf8');
const chunks = knowledge.split(/(?=^#{2,3} )/m).slice(1);
let category = '';
const outline = chunks.filter(chunk => !chunk.startsWith('## 已整理条目')).map((chunk, index) => {
  const [, heading, title] = chunk.match(/^(#{2,3}) (.+)\n/);
  const group = heading === '##' && title.startsWith('主线');
  if (heading === '##') category = group ? title.replace(/^主线[^：]*：/, '') : '';
  return { id: `chapter-${index}`, title, group, category: heading === '###' ? category : '', html: html(chunk.replace(/^#{2,3} .+\n/, ''), 'knowledge/README.md') };
});
await rm('public/content', { recursive: true, force: true });
for (const image of images) {
  await mkdir(path.posix.dirname(`public/content/${image}`), { recursive: true });
  await copyFile(image, `public/content/${image}`);
}
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/content.json', JSON.stringify({ docs, outline }, null, 2));
console.log(`Content: ${outline.filter(x => !x.group).length} outline sections, ${docs.length} Markdown documents.`);
