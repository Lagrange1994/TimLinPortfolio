import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Block accidental/forced reloads with a confirm prompt. Deliberate in-site
// navigation (clicking a link, e.g. a project card) is exempt via the flag.
let userNavigating = false;
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement | null)?.closest?.('a[href]')) {
    userNavigating = true;
    setTimeout(() => { userNavigating = false; }, 1000);
  }
}, true);
window.addEventListener('beforeunload', (e) => {
  if (userNavigating) return;
  e.preventDefault();
  e.returnValue = '';
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
