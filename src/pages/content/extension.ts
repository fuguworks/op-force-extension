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

const popupMessenger = initializeMessenger({ connect: 'popup' });
const inPageMessenger = initializeMessenger({ connect: 'inpage' });
const backgroundMessenger = initializeMessenger({ connect: 'background' });

/**
 * Popup communication
 */

// Handle MM bound tx confirmation
popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
  txsStorage.remove(tx);
  backgroundMessenger.send('rerender', {});
  inPageMessenger.send('confirm', tx);
});

// Handle MM bound tx rejection
popupMessenger.reply('reject', async (tx: MetamaskTransactionRequest) => {
  txsStorage.remove(tx);
  backgroundMessenger.send('rerender', {});
  inPageMessenger.send('reject', tx);
});

/**
 * In page communication
 */

// Handle tx request
// Validation is done in the injected script
inPageMessenger.reply('sign-request', async (tx: MetamaskTransactionRequest) => {
  txsStorage.add(tx);
  backgroundMessenger.send('sign-request', tx);
});
