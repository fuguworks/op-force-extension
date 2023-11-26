/**
 * DO NOT USE import someModule from '...';
 *
 * @issue-url https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
 *
 * Chrome extensions don't support modules in content scripts.
 * If you want to use other modules in content scripts, you need to import them via these files.
 *
 */
import('@pages/content/walletconnect');

console.log('content loaded');

/**
 * injectScript - Inject internal script to available access to the `window`
 *
 * @param  {type} file_path Local path of the internal script.
 * @param  {type} tag The tag as string, where the script will be append (default: 'body').
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(file_path: string, tag: string) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

injectScript(chrome.runtime.getURL('src/pages/injected/index.js'), 'body');

window.addEventListener(
  'SignRequest',
  function (evt: CustomEvent) {
    console.log('[content] received SignRequest message', evt);
    chrome.runtime.sendMessage({
      type: 'SignRequest',
      signRequest: evt.detail,
    });
  },
  false,
);

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.target !== 'op-extension') {
    return;
  }

  console.log('[content] received message from popup', request);

  if (request.value === true) {
    const event = new CustomEvent('Confirm', { detail: request.transaction });
    window.dispatchEvent(event);
  } else {
    const event = new CustomEvent('Reject', { detail: request.transaction });
    window.dispatchEvent(event);
  }
});
