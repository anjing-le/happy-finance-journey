import { renderToStaticMarkup } from 'react-dom/server';
import App from './App';
import content from './generated/content.json';
export const pages = [{ route: 'index.html', title: 'anjing-finance' }, { route: 'overview.html', title: 'anjing-finance' }, ...content.docs.map(doc => ({ route: doc.route, title: `${doc.title} · anjing-finance` }))];
export function render(route: string) { return renderToStaticMarkup(<App route={route} />); }
