import { useEffect, useRef, useState } from 'react';
import content from './generated/content.json';

const base = __SITE_BASE__;
const columns = [{ id: 'knowledge', label: '知识' }, { id: 'practices', label: '最佳实践' }, { id: 'activities', label: '活动' }];
type Reading = { title: string; html: string; module: string; termList?: boolean };
function Markdown({ html }: { html: string }) { return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />; }
function ReadingBody({ reading }: { reading: Reading }) {
  const list = reading.termList ? reading.html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/) : null;
  const terms = list ? [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => match[1].replace(/<[^>]*>/g, '').trim()) : [];
  const [selected, setSelected] = useState(0);
  if (!terms.length) return <Markdown html={reading.html} />;
  return <div className="reading-layout">
    <nav className="term-options" aria-label="选择知识点">{terms.map((term, index) => <button key={term} aria-current={selected === index ? 'true' : undefined} onClick={() => setSelected(index)}>{term}</button>)}</nav>
    <div className="reading-copy"><Markdown html={reading.html.replace(list![0], '')} /><p className="term-pending" aria-live="polite">{terms[selected]}：解释待整理。</p></div>
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
        <section id="knowledge" className="column" aria-label="知识"><h2 className="column-label">知识</h2><div className="slots">{content.outline.filter(item => !item.group && !['最终阶段：形成自己的体系', '学习方式'].includes(item.title)).map(item => <button className="block" key={item.id} aria-haspopup="dialog" onClick={() => setReading({ title: item.title, html: item.html, module: 'knowledge', termList: item.title === '01｜基础名词' })}>{item.category && <span className="chapter-category">{item.category}</span>}<span className="chapter-title">{item.title}</span></button>)}</div><Articles module="knowledge" open={setReading} /></section>
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
