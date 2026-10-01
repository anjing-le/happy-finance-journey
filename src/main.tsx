import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
const root = document.getElementById('root')!;
const app = <App route={decodeURI(location.pathname).replace(__SITE_BASE__, '')} />;
if (root.querySelector('main')) hydrateRoot(root, app);
else createRoot(root).render(app);
