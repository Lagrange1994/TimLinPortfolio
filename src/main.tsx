import './utils/scaleLock';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initCrashLog } from './utils/crashLog';

initCrashLog();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
