import { createRoot } from 'react-dom/client';
import App from './App';
createRoot(document.getElementById('root')!).render(<App route={decodeURI(location.pathname).replace(__SITE_BASE__, '')} />);
