import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { render, pages } from '../.ssr/entry-server.js';
const template = await readFile('dist/index.html', 'utf8');
for (const page of pages) {
  const html = template.replace('<!--app-html-->', render(page.route)).replace('<title>anjing-finance</title>', `<title>${page.title.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c])}</title>`);
  const target = path.join('dist', page.route);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}
await rm('.ssr', { recursive: true });
console.log(`Prerendered ${pages.length} pages. Hydration enables the reading dialog and mobile column navigation.`);
