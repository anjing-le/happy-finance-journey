import { useEffect, useRef, useState } from 'react';
import content from './generated/content.json';

const base = __SITE_BASE__;
const github = 'https://github.com/anjing-le/happy-finance-journey';
const columns = [{ id: 'knowledge', label: '知识' }, { id: 'practices', label: '最佳实践' }, { id: 'activities', label: '活动' }];
type Reading = { title: string; html: string; source?: string };
function Markdown({ html }: { html: string }) { return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />; }
function Articles({ module, open }: { module: string; open: (reading: Reading) => void }) {
  const articles = content.docs.filter(doc => doc.module === module && !doc.file.endsWith('/README.md') && !doc.file.endsWith('/DESIGN.md'));
  return articles.length ? <ul className="slots">{articles.map(doc => <li key={doc.file}><button className="block" aria-haspopup="dialog" onClick={() => open({ title: doc.title, html: doc.html, source: doc.file })}>{doc.title}</button></li>)}</ul> : null;
}
function Home() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [activeColumn, setActiveColumn] = useState('knowledge');
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reading) { dialog.current?.showModal(); document.body.classList.add('detail-open'); }
    else { dialog.current?.close(); document.body.classList.remove('detail-open'); }
    return () => document.body.classList.remove('detail-open');
  }, [reading]);
  function jump(id: string) {
    setActiveColumn(id);
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest', inline: 'start' });
  }
  function syncColumn() {
    const parent = board.current;
    if (!parent) return;
    const left = parent.getBoundingClientRect().left + 24;
    const closest = [...parent.children].sort((a, b) => Math.abs(a.getBoundingClientRect().left - left) - Math.abs(b.getBoundingClientRect().left - left))[0];
    if (closest) setActiveColumn(closest.id);
  }
  return <>
    <main className="workspace" aria-label="金融知识与实践">
      <nav className="column-switch" aria-label="切换栏目">{columns.map(column => <button key={column.id} onClick={() => jump(column.id)} aria-current={activeColumn === column.id ? 'true' : undefined}>{column.label}</button>)}</nav>
      <div className="board" ref={board} onScroll={syncColumn}>
        <section id="knowledge" className="column" aria-label="知识"><h2 className="column-label">知识</h2><div className="slots">{content.outline.map(item => item.group ? <h3 className="group-label" key={item.id}>{item.title}</h3> : <button className="block" key={item.id} aria-haspopup="dialog" onClick={() => setReading({ title: item.title, html: item.html, source: 'knowledge/README.md' })}>{item.title}</button>)}</div><Articles module="knowledge" open={setReading} /></section>
        <section id="practices" className="column" aria-label="最佳实践"><h2 className="column-label">最佳实践</h2><Articles module="practices" open={setReading} />{!content.docs.some(doc => doc.module === 'practices' && !doc.file.endsWith('/README.md') && !doc.file.endsWith('/DESIGN.md')) && <p className="empty">尚未收录</p>}</section>
        <section id="activities" className="column" aria-label="活动"><h2 className="column-label">活动</h2><p className="empty">暂缓</p></section>
      </div>
    </main>
    <dialog className="detail" ref={dialog} aria-label={reading?.title || '内容详情'} onClose={() => setReading(null)} onClick={event => { if (event.target === event.currentTarget) setReading(null); }}>
      <div className="detail-top"><span className="detail-title">{reading?.title}</span>{reading?.source && <a className="source-link" href={`${github}/blob/main/${reading.source}`} target="_blank" rel="noopener noreferrer">原文 ↗</a>}<button className="close-detail" aria-label="关闭详情" onClick={() => setReading(null)}>×</button></div>
      <div className="detail-scroll">{reading && <Markdown html={reading.html} />}</div>
    </dialog>
  </>;
}
export default function App({ route = '' }: { route?: string }) {
  const doc = content.docs.find(item => item.route === route);
  return doc ? <main className="reader"><a className="back-link" href={`${base}${doc.module === 'knowledge' || doc.module === 'practices' ? '#' + doc.module : ''}`}>← 返回</a><Markdown html={doc.html} /><a className="source-link" href={`${github}/blob/main/${doc.file}`}>Markdown 原文 ↗</a></main> : <Home />;
}
