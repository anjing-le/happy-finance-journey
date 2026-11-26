import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import anjing from '../assets/interactive/anjing-stock-guide-v1.webp';
import './stock-lesson.css';

type Source = {
  ownershipLeadHtml: string;
  items: { label: string; html: string }[];
  image: { src: string; alt: string };
  terms: { id: string; title: string }[];
};
type Phase = 'ready' | 'playing' | 'done';
const steps = [
  { title: '拥有股份', question: '有 1 股，也是股东', tag: '是什么' },
  { title: '公司筹钱', question: '公司怎样拿到钱？', tag: '对公司' },
  { title: '股东转让', question: '你卖股票，谁付钱？', tag: '对股东' },
  { title: '完整回顾', question: '把三件事连起来', tag: '回顾' },
];
const EXCHANGE_MS = 1300;
const article = `${__SITE_BASE__}read/knowledge/basic-terms.html`;

function Company({ x = 0, y = 0, scale = 1, expanded = false }: { x?: number; y?: number; scale?: number; expanded?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="stock-building">
    <path className="stock-ground" d="M-12 169 Q76 161 190 169" />
    <path className="stock-wax-blue" d="M9 166 L7 43 L154 40 L158 166 Z" />
    <path className="stock-wax-blue" d="M48 42 L47 5 L116 3 L118 41" />
    <text x="83" y="29" textAnchor="middle" className="stock-drawing-label">公司</text>
    {[0, 1, 2].flatMap(row => [0, 1, 2].map(col => <path key={`${row}-${col}`} className="stock-window" d={`M${27 + col * 44} ${62 + row * 33} l19 -1 l1 18 l-21 1 Z`} />))}
    <path className="stock-door" d="M67 166 L67 133 L99 132 L100 167" />
    {expanded && <g className="stock-new-building"><path className="stock-wax-blue" d="M157 166 L156 102 L220 100 L224 167 Z" /><path className="stock-window" d="M169 117 h18 v17 h-18 Z M197 117 h12 v17 h-12 Z" /><path className="stock-ink-line" d="M168 100 V66 H222 M181 67 V163 M168 72 L207 92" /></g>}
  </g>;
}
function Buyer({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="128" rx="57" ry="7" fill="#e7eef3" />
    <path className="stock-wax-blue" d="M-45 120 Q-53 75 -28 62 Q0 52 27 63 Q52 77 44 121 Q0 132 -45 120 Z" />
    <path className="stock-skin" d="M-27 25 Q-25 -6 1 -6 Q31 -4 29 26 Q27 57 1 57 Q-28 57 -27 25 Z" />
    <path className="stock-ink-line" d="M-20 86 L-19 121 M19 86 L20 121" />
  </g>;
}
function Token({ kind }: { kind: 'stock' | 'money' }) {
  return <g className="stock-token-art">
    <path className={kind === 'stock' ? 'stock-wax-gold' : 'stock-wax-green'} d="M-35 -24 L34 -25 L36 23 L-34 25 Z" />
    <path className="stock-token-mark" d="M-27 -16 L27 -17 M-27 16 L27 15" />
    <text x="0" y="9" textAnchor="middle" className="stock-token-letter">{kind === 'stock' ? '股' : '¥'}</text>
  </g>;
}
export function DrawingDefs({ id }: { id: string }) {
  return <defs>
    <filter id={`${id}-rough`} x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    {(['blue', 'gold', 'green'] as const).map((color, i) => <pattern key={color} id={`${id}-${color}`} width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
      <rect width="11" height="11" fill={['#e0eef7', '#ffe9a3', '#dcefdc'][i]} />
      <path d="M1 0 V11 M5 0 V11 M9 0 V11" stroke={['#9ac4df', '#efbe43', '#9cc69d'][i]} strokeWidth="1.4" opacity=".52" />
      <path d="M0 4 L11 6" stroke="#fff" strokeWidth="1" opacity=".6" />
    </pattern>)}
    {(['stock', 'money'] as const).map(kind => <marker key={kind} id={`${id}-${kind}-arrow`} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M2 2 L10 6 L2 10" fill="none" stroke={kind === 'stock' ? '#ad7922' : '#397454'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></marker>)}
  </defs>;
}
export function Ownership({ shares, id }: { shares: number; id: string }) {
  return <>
    <text x="360" y="39" textAnchor="middle" className="stock-scene-title">假设：公司共 100 股</text>
    <Company x={75} y={119} scale={1.05} />
    <path className="stock-soft-line" d="M265 200 Q301 197 339 199" />
    <text x="302" y="179" textAnchor="middle" className="stock-small-label">分成股份</text>
    <g role="img" aria-label={`100 个格子，每格 1 股；${shares} 个黄色格子代表你持有 ${shares} 股，占 ${shares}%`} data-share-count={shares}>
      {Array.from({ length: 100 }, (_, i) => <rect key={i} data-share-cell="true" data-owned={i < shares ? 'true' : 'false'} className="stock-share-cell" x={360 + (i % 10) * 24} y={72 + Math.floor(i / 10) * 24} width="22" height="22" rx="1" fill={`url(#${id}-${i < shares ? 'gold' : 'blue'})`} />)}
    </g>
    <text x="480" y="338" textAnchor="middle" className="stock-drawing-label">每格 1 股 · 黄色是你的</text>
    <image href={anjing} x="295" y="310" width="80" height="100" />
    <Buyer x={516} y={350} scale={.45} />
    <text x="335" y="437" textAnchor="middle" className="stock-owned-label">你：{shares} 股 / {shares}%</text>
    <text x="516" y="437" textAnchor="middle" className="stock-drawing-label">其他股东：{100 - shares} 股</text>
  </>;
}
export function Exchange({ step, phase, replay, dividend, id }: { step: number; phase: Phase; replay: number; dividend: boolean; id: string }) {
  const issuance = step === 1;
  const companyLeft = issuance || dividend;
  const finished = phase === 'done';
  const stockX = finished ? 463 : 243;
  const moneyX = finished ? (dividend ? 463 : 253) : (dividend ? 243 : 473);
  return <>
    <text x="360" y="39" textAnchor="middle" className="stock-scene-title">{issuance ? '发行新股 · 钱进入公司' : dividend ? '公司决定分配利润时' : '转让已有股票 · 钱给卖方'}</text>
    {companyLeft ? <Company x={59} y={151} expanded={issuance && finished} /> : <image href={anjing} x="65" y="170" width="127" height="158" />}
    {companyLeft ? <image href={anjing} x="525" y="170" width="127" height="158" /> : <Buyer x={589} y={196} />}
    <text x="135" y="369" textAnchor="middle" className="stock-drawing-label">{companyLeft ? '公司' : '你（卖方）'}</text>
    <text x="589" y="369" textAnchor="middle" className="stock-drawing-label">{issuance ? '认购新股的人' : dividend ? '你（股东）' : '另一位买方'}</text>
    {!dividend && <>
      <path className="stock-flow-stock" d="M228 143 Q354 137 518 143" markerEnd={`url(#${id}-stock-arrow)`} />
      <text x="360" y="108" textAnchor="middle" className="stock-stock-label">{issuance ? '新股 →' : '股票 →'}</text>
      <g transform={`translate(${stockX} 143)`}><g key={`stock-${replay}`} className={phase === 'playing' ? 'stock-packet moving' : ''} style={{ '--travel': '220px' } as CSSProperties}><Token kind="stock" /></g></g>
    </>}
    <path className="stock-flow-money" d={dividend ? 'M228 218 Q357 213 518 218' : 'M489 246 Q354 252 204 246'} markerEnd={`url(#${id}-money-arrow)`} />
    <text x="360" y={dividend ? 155 : 296} textAnchor="middle" className="stock-money-label">{dividend ? '公司分配的钱 →' : '← 钱'}</text>
    <g transform={`translate(${moneyX} ${dividend ? 218 : 246})`}><g key={`money-${replay}`} className={phase === 'playing' ? 'stock-packet moving' : ''} style={{ '--travel': dividend ? '220px' : '-220px' } as CSSProperties}><Token kind="money" /></g></g>
    <text x="360" y="425" textAnchor="middle" className="stock-status-label">{phase === 'playing' ? '看清两边：谁给股票，谁给钱' : finished ? issuance ? '公司收到认购款，可以用来发展业务' : dividend ? '公司分配的钱，交给股东' : '买方拿到股票，你收到买方的钱' : '点击「播放演示」，跟着箭头看一次'}</text>
  </>;
}

export default function StockLesson({ source }: { source: Source }) {
  const [step, setStep] = useState(0);
  const [shares, setShares] = useState(1);
  const [phase, setPhase] = useState<Phase>('ready');
  const [replay, setReplay] = useState(0);
  const [dividend, setDividend] = useState(false);
  const [answer, setAnswer] = useState<'company' | 'buyer' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = `stock${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const current = steps[step];
  const question = step === 0 ? `有 ${shares} 股，也是股东` : step === 2 && dividend ? '公司分钱，钱给谁？' : current.question;
  function go(next: number) {
    if (timer.current) clearTimeout(timer.current);
    setStep(Math.max(0, Math.min(steps.length - 1, next)));
    setPhase('ready'); setDividend(false); setAnswer(null);
    if (matchMedia('(max-width: 960px)').matches) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function play() {
    if (timer.current) clearTimeout(timer.current);
    setReplay(v => v + 1);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('done'); return; }
    setPhase('playing');
    timer.current = setTimeout(() => setPhase('done'), EXCHANGE_MS);
  }
  function changeMode(next: boolean) {
    if (timer.current) clearTimeout(timer.current);
    setDividend(next); setPhase('ready'); setAnswer(null);
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); go(step + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(step - 1); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);
  const shownHtml = source.items[step === 0 ? 0 : step === 1 ? 1 : 2].html;
  return <main className="stock-lesson" style={{ '--exchange-duration': `${EXCHANGE_MS}ms`, '--wax-rough': `url(#${id}-rough)`, '--wax-blue': `url(#${id}-blue)`, '--wax-gold': `url(#${id}-gold)`, '--wax-green': `url(#${id}-green)` } as CSSProperties}>
    <header className="stock-topbar"><a href={`${__SITE_BASE__}#knowledge`}>← 知识</a><span>FINANCE JOURNEY</span><span className="stock-pilot-tag"><i aria-hidden="true" />互动样稿</span></header>
    <div className="stock-shell">
      <aside className="stock-rail"><p className="stock-eyebrow">基础名词 <span>{source.terms.length}</span></p><nav aria-label="基础名词">{source.terms.map((term, i) => <a key={term.id} href={term.title === '股票' ? `${__SITE_BASE__}learn/stock.html` : `${article}#${encodeURIComponent(term.id)}`} aria-current={term.title === '股票' ? 'page' : undefined}><span>{String(i + 1).padStart(2, '0')}</span>{term.title}{term.title === '股票' && <span className="stock-rail-dot" />}</a>)}</nav><a className="stock-original-link" href={article}>阅读完整图文 ↗</a></aside>
      <section className="stock-lesson-main" aria-label="股票互动演示">
        <header className="stock-lesson-heading"><h1>股票<span>交互学习</span></h1><span className="stock-step-count">{String(step + 1).padStart(2, '0')}<small> / 04</small></span></header>
        <div className="stock-paper" data-step={step}>
          <div className="stock-scene-label"><span className={`stock-scene-dot step-${step}`} />{step === 0 ? '股份与股东' : step === 1 ? '公司与认购人' : step === 2 ? dividend ? '公司与股东' : '卖方与买方' : '一张图，回看全部'}</div>
          <div className="stock-stage" aria-label={question}>
            {step === 3 ? <img className="stock-review-image" src={source.image.src} alt={source.image.alt} width="1672" height="941" /> : <svg viewBox="0 0 720 460" className="stock-scene" role="img" aria-label={step === 0 ? `假设公司100股，你持有${shares}股，占${shares}%` : step === 1 ? '公司给认购人新股，认购人把钱给公司' : dividend ? '公司决定分配利润时把钱给股东' : '你给买方股票，买方把钱给你'}><DrawingDefs id={id} />{step === 0 ? <Ownership shares={shares} id={id} /> : <Exchange step={step} phase={phase} replay={replay} dividend={dividend} id={id} />}</svg>}
          </div>
          <div className="stock-scene-controls">
            {step === 0 ? <div className="stock-share-options"><span>换个持股假设</span>{[1, 5, 10].map(n => <button key={n} type="button" aria-pressed={shares === n} onClick={() => setShares(n)}>{n} 股</button>)}</div> : step === 3 ? <span className="stock-quiet-note">回看原稿：以持有 1 股为例。</span> : <><span className="stock-quiet-note" aria-live="polite">{phase === 'done' ? '演示完成' : '独立场景示意'}</span><button className="stock-replay" type="button" disabled={phase === 'playing'} onClick={play}>{phase === 'playing' ? '演示中…' : phase === 'done' ? '↻ 重播' : '▷ 播放'}</button></>}
          </div>
        </div>
        <nav className="stock-timeline" aria-label="学习步骤">{steps.map((s, i) => <button key={s.title} type="button" aria-current={i === step ? 'step' : undefined} onClick={() => go(i)}><span className="stock-step-number">{i + 1}</span><span>{s.title}</span></button>)}</nav>
        <p className="stock-lesson-footnote">教学假设<span>← → 切换</span></p>
      </section>
      <aside className="stock-guide" aria-label="本步讲解"><div className="stock-guide-content" aria-live="polite" aria-atomic="true"><div className="stock-guide-kicker">{current.tag}</div><h2>{question}</h2>
        {step === 0 ? <div className="stock-source-copy"><div dangerouslySetInnerHTML={{ __html: source.ownershipLeadHtml }} /><p>假设公司共 100 股，你持有 <strong>{shares} 股</strong>，就拥有 <strong>{shares}/100（{shares}%）</strong>，也是股东之一。</p></div> : step < 3 ? <div className="stock-source-copy" dangerouslySetInnerHTML={{ __html: shownHtml }} /> : <ul className="stock-summary-copy">{source.items.map(item => <li key={item.label}><strong>{item.label}</strong><div dangerouslySetInnerHTML={{ __html: item.html }} /></li>)}</ul>}
        {step === 2 && <><div className="stock-scene-switch" aria-label="查看股东的两种关系"><button type="button" aria-pressed={!dividend} onClick={() => changeMode(false)}>转让股票</button><button type="button" aria-pressed={dividend} onClick={() => changeMode(true)}>分配利润</button></div>{!dividend && <div className="stock-check"><p>卖出这股，谁付钱给你？</p><div><button type="button" aria-pressed={answer === 'company'} onClick={() => setAnswer('company')}>公司</button><button type="button" aria-pressed={answer === 'buyer'} onClick={() => setAnswer('buyer')}>买方</button></div><p className="stock-answer" role="status">{answer === 'buyer' ? '对，是买方。股票给买方，钱给你。' : answer === 'company' ? '再看绿色箭头：这次是买方付钱，公司没有参与转让。' : '先想一下，也可以重播看看。'}</p></div>}</>}
      </div><footer className="stock-guide-footer"><button type="button" disabled={step === 0} onClick={() => go(step - 1)}>← 上一步</button>{step < 3 ? <button className="stock-next" type="button" onClick={() => go(step + 1)}>下一步 →</button> : <button className="stock-next" type="button" onClick={() => go(0)}>再看一遍 ↺</button>}</footer></aside>
    </div>
  </main>;
}
