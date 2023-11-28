import { initializeMessenger } from '@root/src/messengers';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';

const content = initializeMessenger({ connect: 'contentScript' });
const popup = initializeMessenger({ connect: 'popup' });

/**
 * This page exists as a proxy for messaging between the popup
 * and the injected or content scripts
 */

// Content script cannot access chrome APIs
content.reply('sign-request', async (tx: MetamaskTransactionRequest) => {
  console.log('background sign-request');
  await chrome.windows.create({
    url: chrome.runtime.getURL('src/pages/popup/index.html'),
    type: 'popup',
    width: 390,
    height: 640,
    top: 0,
    focused: true,
    left: 0,
  });
});
content.reply('rerender', args => popup.send('rerender', args));

// Popup created via chrome.window.create doesn't register
// content script
popup.reply('confirm', args => content.send('confirm', args));
popup.reply('reject', args => content.send('reject', args));
