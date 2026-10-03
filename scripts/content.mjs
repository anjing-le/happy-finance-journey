import { readFile, readdir, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const headingCounts = new Map();
marked.use({ renderer: { heading({ tokens, depth, text }) {
  const slug = text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-') || 'section';
  const count = headingCounts.get(slug) || 0;
  headingCounts.set(slug, count + 1);
  const id = count ? `${slug}-${count}` : slug;
  return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
}, blockquote({ tokens, text }) {
  if (text.trim() === '配图预留') return '<div class="illustration-placeholder" aria-label="配图预留"><span>配图预留</span></div>';
  return `<blockquote>${this.parser.parse(tokens)}</blockquote>`;
} } });
const base = process.env.BASE_PATH || '/';
const modules = ['knowledge', 'practices', 'activities'];
const pages = [];
const images = new Set();
const imageSizes = new Map();
function imageSize(file) {
  const buffer = readFileSync(file);
  const dimensions = (width, height) => width && height ? { width: String(width), height: String(height) } : {};
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return dimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
  }
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return {};
  const end = Math.min(buffer.length, buffer.readUInt32LE(4) + 8);
  for (let offset = 12; offset + 8 <= end;) {
    const kind = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + length > end) return {};
    if (kind === 'VP8X' && length >= 10) return dimensions(buffer.readUIntLE(start + 4, 3) + 1, buffer.readUIntLE(start + 7, 3) + 1);
    if (kind === 'VP8L' && length >= 5 && buffer[start] === 0x2f) {
      const bits = buffer.readUInt32LE(start + 1);
      return dimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    }
    if (kind === 'VP8 ' && length >= 10 && buffer.subarray(start + 3, start + 6).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
      return dimensions(buffer.readUInt16LE(start + 6) & 0x3fff, buffer.readUInt16LE(start + 8) & 0x3fff);
    }
    offset = start + length + (length % 2);
  }
  return {};
}
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
  headingCounts.clear();
  const tokens = marked.lexer(markdown);
  marked.walkTokens(tokens, token => {
    if (token.type !== 'link' && token.type !== 'image') return;
    if (/^(?:[a-z]+:|\/\/|#)/i.test(token.href)) return;
    const [file, hash] = token.href.split('#');
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), file));
    if (resolved.startsWith('../') || path.posix.isAbsolute(resolved)) throw new Error(`Asset outside repository: ${source}`);
    if (token.type === 'image') {
      images.add(resolved);
      token.href = `${base}content/${resolved}`;
      if (!imageSizes.has(token.href)) imageSizes.set(token.href, imageSize(resolved));
    }
    else if (moduleAnchors[resolved] && !hash) token.href = `${base}#${moduleAnchors[resolved]}`;
    else if (routes.has(resolved)) token.href = `${base}${routes.get(resolved)}${hash ? '#' + hash : ''}`;
    else throw new Error(`Unresolved link: ${source} → ${token.href}`);
  });
  const output = marked.parser(tokens);
  return sanitizeHtml(output, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, div: ['class', 'aria-label'], img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'], h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'] },
    allowedClasses: { div: ['illustration-placeholder'] },
    transformTags: { img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, ...imageSizes.get(attribs.src), loading: 'lazy', decoding: 'async' } }) },
  });
}
const docs = [];
const toc = output => [...output.matchAll(/<h([2-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map(match => ({ id: match[2], title: match[3].replace(/<[^>]*>/g, ''), level: Number(match[1]) }));
for (const file of pages) {
  const md = await readFile(file, 'utf8');
  const title = md.match(/^# (.+)$/m)?.[1] || '目标与维护规则';
  const output = html(md, file);
  docs.push({ file, route: routes.get(file), title, html: output, toc: toc(output), module: file.split('/')[0] });
}
const knowledge = await readFile('knowledge/README.md', 'utf8');
const chunks = knowledge.split(/(?=^#{2,3} )/m).slice(1);
let category = '';
const outline = chunks.filter(chunk => !chunk.startsWith('## 已整理条目')).map((chunk, index) => {
  const [, heading, title] = chunk.match(/^(#{2,3}) (.+)\n/);
  const group = heading === '##' && title.startsWith('主线');
  if (heading === '##') category = group ? title.replace(/^主线[^：]*：/, '') : '';
  const articleLink = chunk.match(/\[阅读全文\]\(([^)#]+\.md)\)/)?.[1];
  const articleFile = articleLink ? path.posix.normalize(path.posix.join('knowledge', articleLink)) : '';
  const article = articleFile ? docs.find(doc => doc.file === articleFile) : undefined;
  if (articleFile && !article) throw new Error(`Missing chapter article: ${articleFile}`);
  const output = article?.html || html(chunk.replace(/^#{2,3} .+\n/, ''), 'knowledge/README.md');
  return { id: `chapter-${index}`, title, group, category: heading === '###' ? category : '', articleFile, html: output, toc: article?.toc || [] };
});
await rm('public/content', { recursive: true, force: true });
for (const image of images) {
  await mkdir(path.posix.dirname(`public/content/${image}`), { recursive: true });
  await copyFile(image, `public/content/${image}`);
}
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/content.json', JSON.stringify({ docs, outline }, null, 2));
console.log(`Content: ${outline.filter(x => !x.group).length} outline sections, ${docs.length} Markdown documents.`);
