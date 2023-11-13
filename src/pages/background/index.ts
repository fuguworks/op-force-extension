import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

chrome.runtime.onMessage.addListener(async message => {
  if (message.type !== 'SignRequest') {
    return;
  }

  console.log('[background] received message', message);

  const { signRequests } = await chrome.storage.local.get({ signRequests: [] });
  console.log('[background]', signRequests);
  await chrome.storage.local.set({ signRequests: [...signRequests, message.signRequest] });

  await chrome.windows.create({
    url: chrome.runtime.getURL('src/pages/popup/index.html'),
    type: 'popup',
    width: 300,
    height: 300,
    top: 0,
  });
});
