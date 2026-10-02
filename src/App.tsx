import { useEffect, useRef, useState } from 'react';
import content from './generated/content.json';

const base = __SITE_BASE__;
const columns = [{ id: 'knowledge', label: '知识' }, { id: 'practices', label: '最佳实践' }, { id: 'activities', label: '活动' }];
type Reading = { title: string; html: string; module: string; illustrated?: boolean };
function Markdown({ html }: { html: string }) { return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />; }
function TermCopy({ html }: { html: string }) {
  const list = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
  const terms = list ? [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => match[1].replace(/<[^>]*>/g, '').trim()) : [];
  const [selected, setSelected] = useState(0);
  if (!terms.length) return <Markdown html={html} />;
  return <><div className="term-options" role="group" aria-label="选择知识点">{terms.map((term, index) => <button key={term} aria-pressed={selected === index} onClick={() => setSelected(index)}>{term}</button>)}</div><Markdown html={html.replace(list![0], '')} /><p className="term-pending" aria-live="polite">{terms[selected]}：解释待整理。</p></>;
}
function ReadingBody({ reading }: { reading: Reading }) {
  const slides = [...reading.html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>|<img\b[^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*>/g)].map(match => ({ src: match[1] || match[4], alt: match[2] || match[3] || '' }));
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  if (!slides.length && !reading.illustrated) return <Markdown html={reading.html} />;
  const text = reading.html.replace(/<img\b[^>]*>/g, '').replace(/<p>\s*<\/p>/g, '');
  function select(index: number) {
    const parent = track.current;
    if (!parent) return;
    parent.scrollTo({ left: index * parent.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <div className="reading-layout">
    <div className="reading-copy">{reading.illustrated ? <TermCopy html={text} /> : <Markdown html={text} />}</div>
    <div className="image-carousel" role="region" aria-label="知识配图轮播">
      {!slides.length && <div className="image-empty" aria-label="预留配图区域"><span>配图待补充</span></div>}
      <div className="carousel-track" ref={track} onScroll={() => { const parent = track.current; if (parent) setActive(Math.round(parent.scrollLeft / parent.clientWidth)); }}>
        {slides.map((slide, index) => <figure className="carousel-slide" key={slide.src}><img src={slide.src} alt={slide.alt} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" /></figure>)}
      </div>
      {slides.length > 1 && <div className="carousel-controls"><button aria-label="上一张配图" disabled={active === 0} onClick={() => select(active - 1)}>‹</button><div className="carousel-dots">{slides.map((slide, index) => <button key={slide.src} aria-label={`第 ${index + 1} 张配图`} aria-current={active === index ? 'true' : undefined} onClick={() => select(index)} />)}</div><span className="carousel-count" aria-live="polite">{active + 1} / {slides.length}</span><button aria-label="下一张配图" disabled={active === slides.length - 1} onClick={() => select(active + 1)}>›</button></div>}
    </div>
  </div>;
}
function Articles({ module, open }: { module: string; open: (reading: Reading) => void }) {
  const articles = content.docs.filter(doc => doc.module === module && !doc.file.endsWith('/README.md') && !doc.file.endsWith('/DESIGN.md'));
  return articles.length ? <ul className="slots">{articles.map(doc => <li key={doc.file}><button className="block" aria-haspopup="dialog" onClick={() => open({ title: doc.title, html: doc.html, module })}>{doc.title}</button></li>)}</ul> : null;
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
        <section id="knowledge" className="column" aria-label="知识"><h2 className="column-label">知识</h2><div className="slots">{content.outline.filter(item => !item.group && !['最终阶段：形成自己的体系', '学习方式'].includes(item.title)).map(item => <button className="block" key={item.id} aria-haspopup="dialog" onClick={() => setReading({ title: item.title, html: item.html, module: 'knowledge', illustrated: item.title === '01｜基础名词' })}>{item.category && <span className="chapter-category">{item.category}</span>}<span className="chapter-title">{item.title}</span></button>)}</div><Articles module="knowledge" open={setReading} /></section>
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
  return doc ? <main className="reader" data-module={doc.module}><a className="back-link" href={`${base}${doc.module === 'knowledge' || doc.module === 'practices' ? '#' + doc.module : ''}`}>← 返回</a><Markdown html={doc.html} /></main> : <Home />;
}
