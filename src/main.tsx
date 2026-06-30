import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@govtechsg/sgds-web-component/themes/night.css';
import '@govtechsg/sgds-web-component';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
