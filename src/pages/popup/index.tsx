import React from 'react';
import { createRoot } from 'react-dom/client';
import '@pages/popup/index.css';
import { Providers } from '@pages/popup/Providers';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/popup');

function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(<Providers />);
}

init();
