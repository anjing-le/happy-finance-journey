import { useEffect, useRef, useState, type CSSProperties } from 'react';
import content from './generated/content.json';

const base = __SITE_BASE__;
const columns = [{ id: 'knowledge', label: '知识' }, { id: 'practices', label: '最佳实践' }, { id: 'activities', label: '活动' }];
type Reading = { title: string; html: string; module: string; toc?: { id: string; title: string; level: number }[] };
function Markdown({ html }: { html: string }) {
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const viewer = useRef<HTMLDialogElement>(null);
  // The HTML is already sanitized at build time. Existing image links retain their destination.
  const body = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>|<img\b[^>]*>/g, tag => {
    if (!tag.startsWith('<img')) return tag;
    const alt = /alt="([^"]*)"/.exec(tag)?.[1] || '文章配图';
    return `<button type="button" class="article-image" aria-haspopup="dialog" aria-label="放大图片：${alt}">${tag}</button>`;
  });
  useEffect(() => { if (image) viewer.current?.showModal(); }, [image]);
  return <>
    <div className="prose" dangerouslySetInnerHTML={{ __html: body }} onClick={event => {
      const button = (event.target as Element).closest('button.article-image');
      const selected = button?.querySelector('img');
      if (!selected) return;
      setZoomed(false);
      setImage({ src: selected.currentSrc || selected.src, alt: selected.alt });
    }} />
    <dialog className="image-viewer" ref={viewer} aria-label="图片预览" data-zoomed={zoomed} onClose={event => { event.stopPropagation(); setImage(null); }} onClick={event => { if (event.target === event.currentTarget) viewer.current?.close(); }}>
      <div className="image-viewer-top"><span className="image-viewer-hint">{zoomed ? '滑动查看 · 点击缩小' : '点击图片放大'}</span><button type="button" className="close-detail" aria-label="关闭图片" onClick={() => viewer.current?.close()}>×</button></div>
      <div className="image-stage"><button type="button" className="image-zoom" aria-label={zoomed ? '缩小图片' : '放大至原图，滑动或滚动查看'} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{image && <img src={image.src} alt={image.alt} />}</button></div>
    </dialog>
  </>;
}
function ReadingBody({ reading }: { reading: Reading }) {
  const headings = reading.toc || [];
  const [position, setPosition] = useState({ id: headings[0]?.id || '', progress: 0 });
  const copy = useRef<HTMLDivElement>(null);
  const endTarget = useRef<string | null>(null);
  useEffect(() => {
    const parent = copy.current;
    if (!parent) return;
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; syncReading(); });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(parent);
    const prose = parent.querySelector('.prose');
    if (prose) observer.observe(prose);
    parent.addEventListener('scroll', schedule, { passive: true });
    parent.addEventListener('load', schedule, true);
    schedule();
    return () => {
      observer.disconnect();
      parent.removeEventListener('scroll', schedule);
      parent.removeEventListener('load', schedule, true);
      cancelAnimationFrame(frame);
    };
  }, [reading.html, reading.toc]);
  function jump(id: string) {
    const parent = copy.current;
    const heading = [...(parent?.querySelectorAll('[id]') || [])].find(item => item.id === id);
    if (!parent || !heading) return;
    const top = parent.scrollTop + heading.getBoundingClientRect().top - parent.getBoundingClientRect().top - 24;
    // A short section near the end may not reach the top. Keep its clicked label selected.
    endTarget.current = top >= parent.scrollHeight - parent.clientHeight - 1 ? id : null;
    setPosition({ id, progress: 0 });
    parent.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (endTarget.current && parent.scrollTop + parent.clientHeight >= parent.scrollHeight - 2) syncReading();
  }
  function syncReading() {
    const parent = copy.current;
    if (!parent || !headings.length) return;
    const parentTop = parent.getBoundingClientRect().top;
    const sections = [...parent.querySelectorAll('h2[id],h3[id],h4[id],h5[id],h6[id]')]
      .filter(item => headings.some(heading => heading.id === item.id))
      .map(item => ({ id: item.id, top: parent.scrollTop + item.getBoundingClientRect().top - parentTop }));
    if (!sections.length) return;
    const line = parent.scrollTop + 24;
    const atEnd = parent.scrollHeight > parent.clientHeight && parent.scrollTop + parent.clientHeight >= parent.scrollHeight - 2;
    let index = 0;
    sections.forEach((section, sectionIndex) => { if (section.top <= line + 1) index = sectionIndex; });
    if (atEnd) index = Math.max(0, endTarget.current ? sections.findIndex(section => section.id === endTarget.current) : sections.length - 1);
    const start = sections[index].top;
    const end = sections[index + 1]?.top ?? parent.scrollHeight;
    const progress = atEnd ? 100 : Math.round(Math.max(0, Math.min(1, (line - start) / Math.max(1, end - start))) * 100);
    const id = sections[index].id;
    setPosition(previous => previous.id === id && previous.progress === progress ? previous : { id, progress });
  }
  function resumeReading() {
    if (endTarget.current) { endTarget.current = null; syncReading(); }
  }
  if (!headings.length) return <Markdown html={reading.html} />;
  return <div className="reading-layout">
    <nav className="article-index" aria-label="文章目录">{headings.map(heading => <a key={heading.id} href={`#${heading.id}`} aria-current={position.id === heading.id ? 'location' : undefined} style={position.id === heading.id ? { '--reading-progress': `${position.progress}%` } as CSSProperties : undefined} onClick={event => { event.preventDefault(); jump(heading.id); }}>{heading.title}</a>)}</nav>
    <div className="reading-copy" ref={copy} tabIndex={0} role="region" aria-label="文章正文" onWheel={resumeReading} onTouchStart={resumeReading} onKeyDown={event => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) resumeReading(); }}><Markdown html={reading.html} /></div>
  </div>;
}
function Articles({ module, open }: { module: string; open: (reading: Reading) => void }) {
  const articles = content.docs.filter(doc => doc.module === module && !doc.file.endsWith('/README.md') && !doc.file.endsWith('/DESIGN.md') && !content.outline.some(item => item.articleFile === doc.file));
  return articles.length ? <ul className="slots">{articles.map(doc => <li key={doc.file}><button className="block" aria-haspopup="dialog" onClick={() => open({ title: doc.title, html: doc.html, module, toc: doc.toc })}>{doc.title}</button></li>)}</ul> : null;
}
function Home() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [activeColumn, setActiveColumn] = useState('knowledge');
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reading) { dialog.current?.querySelector('.detail-scroll')?.scrollTo(0, 0); dialog.current?.showModal(); document.body.classList.add('detail-open'); }
    else { dialog.current?.close(); document.body.classList.remove('detail-open'); }
    return () => document.body.classList.remove('detail-open');
  }, [reading]);
  useEffect(() => {
    function restoreColumn() {
      const id = location.hash.slice(1);
      if (columns.some(column => column.id === id)) jump(id, 'instant');
    }
    restoreColumn();
    window.addEventListener('hashchange', restoreColumn);
    return () => window.removeEventListener('hashchange', restoreColumn);
  }, []);
  function jump(id: string, behavior: ScrollBehavior = 'smooth') {
    const parent = board.current;
    const column = document.getElementById(id);
    if (!parent || !column) return;
    setActiveColumn(id);
    parent.scrollTo({ left: parent.scrollLeft + column.getBoundingClientRect().left - parent.getBoundingClientRect().left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : behavior });
  }
  function syncColumn() {
    const parent = board.current;
    if (!parent) return;
    const left = parent.getBoundingClientRect().left;
    const closest = [...parent.children].sort((a, b) => Math.abs(a.getBoundingClientRect().left - left) - Math.abs(b.getBoundingClientRect().left - left))[0];
    if (closest) setActiveColumn(closest.id);
  }
  return <>
    <main className="workspace" aria-label="金融知识与实践">
      <nav className="column-switch" aria-label="切换栏目">{columns.map(column => <button key={column.id} data-column={column.id} onClick={() => jump(column.id)} aria-current={activeColumn === column.id ? 'true' : undefined}>{column.label}</button>)}</nav>
      <div className="board" ref={board} onScroll={syncColumn}>
        <section id="knowledge" className="column" aria-label="知识"><h2 className="column-label">知识</h2><div className="slots">{content.outline.filter(item => !item.group && !['最终阶段：形成自己的体系', '学习方式'].includes(item.title)).map(item => <button className="block" key={item.id} aria-haspopup="dialog" onClick={() => setReading({ title: item.title, html: item.html, module: 'knowledge', toc: item.toc })}>{item.category && <span className="chapter-category">{item.category}</span>}<span className="chapter-title">{item.title}</span></button>)}</div><Articles module="knowledge" open={setReading} /></section>
        <section id="practices" className="column" aria-label="最佳实践"><h2 className="column-label">最佳实践</h2><Articles module="practices" open={setReading} />{!content.docs.some(doc => doc.module === 'practices' && !doc.file.endsWith('/README.md') && !doc.file.endsWith('/DESIGN.md')) && <p className="empty">尚未收录</p>}</section>
        <section id="activities" className="column" aria-label="活动"><h2 className="column-label">活动</h2><p className="empty">暂缓</p></section>
      </div>
    </main>
    <dialog className="detail" data-module={reading?.module} ref={dialog} aria-label={reading?.title || '内容详情'} onClose={() => setReading(null)} onClick={event => { if (event.target === event.currentTarget) setReading(null); }}>
      <div className="detail-top"><button className="close-detail" aria-label="关闭详情" onClick={() => setReading(null)}>×</button></div>
      <div className="detail-scroll">{reading && <ReadingBody key={reading.title} reading={reading} />}</div>
    </dialog>
  </>;
}
export default function App({ route = '' }: { route?: string }) {
  const doc = content.docs.find(item => item.route === route);
  return doc ? <main className="reader" data-module={doc.module}><a className="back-link" href={`${base}${doc.module === 'knowledge' || doc.module === 'practices' ? '#' + doc.module : ''}`}>← 返回</a><ReadingBody reading={{ title: doc.title, html: doc.html, module: doc.module, toc: doc.toc }} /></main> : <Home />;
}
