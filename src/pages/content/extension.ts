import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

import { initializeMessenger } from '@root/src/messengers';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';
import txsStorage from '@root/src/shared/storages/txsStorage';

reloadOnUpdate('pages/background/index.ts');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

const popupMessenger = initializeMessenger({ connect: 'popup' });
const inPageMessenger = initializeMessenger({ connect: 'inpage' });

async function init() {
  /**
   * Popup communication
   */

  // Handle MM bound tx confirmation
  popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
    inPageMessenger.send('confirm', tx);
  });

  // Handle MM bound tx rejection
  popupMessenger.reply('reject', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
  });

  /**
   * In page communication
   */

  // Handle tx request
  // Validation is done in the injected script
  inPageMessenger.reply('sign-request', async (tx: MetamaskTransactionRequest) => {
    txsStorage.add(tx);

    await chrome.windows.create({
      url: chrome.runtime.getURL('src/pages/popup/index.html'),
      type: 'popup',
      width: 300,
      height: 300,
      top: 0,
    });
  });
}

init();
