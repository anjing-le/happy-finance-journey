import content from './generated/content.json';

const base = __SITE_BASE__;
const github = 'https://github.com/anjing-le/happy-finance-journey';
function Markdown({ html }: { html: string }) { return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />; }
function Header() {
  return <header className="site-header"><a className="brand" href={base}><span className="brand-mark">F</span><span>anjing-finance</span></a><nav aria-label="主导航"><a href={`${base}#knowledge`}>知识</a><a href={`${base}#practices`}>最佳实践</a><a href={`${base}#activities`}>活动</a></nav></header>;
}
function Footer() {
  return <footer><span>一起学，一起做，不断变好。</span><div><a href={`${base}about.html`}>目标与维护规则</a><a href={github}>GitHub ↗</a></div></footer>;
}
function Articles({ module }: { module: string }) {
  const articles = content.docs.filter(doc => doc.module === module && !doc.file.endsWith('/README.md') && !doc.file.endsWith('/DESIGN.md'));
  if (!articles.length) return <p className="empty">{module === 'knowledge' ? '当前收录的是学习脉络，具体知识正文逐篇打磨。' : '尚未收录。先从实际用过的方法开始，记录做法、依据和限制。'}</p>;
  return <ul className="article-list">{articles.map(doc => <li key={doc.file}><a href={`${base}${doc.route}`}>{doc.title}<span aria-hidden="true">↗</span></a></li>)}</ul>;
}
function Home() {
  return <>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">HAPPY FINANCE JOURNEY</p><h1>理解市场，<br />形成自己的判断。</h1><p className="intro">以股票投资与交易为实践方向，<br className="desktop-break" />积累知识，检验方法，逐步形成自己的体系。</p><a className="start-link" href="#knowledge">从知识开始 <span aria-hidden="true">↓</span></a></div><img className="hero-art" src={`${base}content/assets/journey-poster.png`} width="1254" height="1254" alt="黄发黑色 hoodie 的安静，在金融知识、资料分析和手机股票软件实践中学习。" /></section>
    <section id="knowledge" className="section"><div className="section-heading"><div><p className="eyebrow">01 / KNOWLEDGE</p><h2>知识</h2></div><p>先词汇，再关系，再理论，再系统。</p></div>
      <div className="outline">{content.outline.map(item => item.group ? <h3 className="group-title" key={item.id}>{item.title}</h3> : <details className="chapter" id={item.id} key={item.id}><summary><span>{item.title}</span><span className="expand" aria-hidden="true">+</span></summary><Markdown html={item.html} /></details>)}</div>
      <div className="articles-heading"><h3>已整理条目</h3><Articles module="knowledge" /></div>
    </section>
    <section id="practices" className="section"><div className="section-heading"><div><p className="eyebrow">02 / PRACTICES</p><h2>最佳实践</h2></div><p>方法经过实践，再回头检查。</p></div><div className="practice-note"><p>解决什么问题 · 怎么做 · 何时适用 · 验证依据 · 有什么限制</p><Articles module="practices" /></div></section>
    <section id="activities" className="activity-pause"><div><h2>活动 <span>暂缓</span></h2><p>当前先积累知识与最佳实践。</p></div><span className="pause-symbol" aria-hidden="true">Ⅱ</span></section>
  </>;
}
export default function App({ route = '' }: { route?: string }) {
  const doc = content.docs.find(item => item.route === route);
  return <><a className="skip-link" href="#main">跳到正文</a><Header /><main id="main">{doc ? <article className="reader"><a className="back-link" href={`${base}${doc.module === 'knowledge' || doc.module === 'practices' ? '#' + doc.module : ''}`}>← 返回首页</a><Markdown html={doc.html} /><a className="source-link" href={`${github}/blob/main/${doc.file}`}>查看 Markdown 原文 ↗</a></article> : <Home />}</main><Footer /></>;
}
