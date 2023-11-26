import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

import { walletConnectProjectId } from '@root/src/shared/config/constants';
import SignClient from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';
import { initializeMessenger } from '@root/src/messengers';
import sessionsStorage from '@root/src/shared/storages/sessionsStorage';
import appsStorage from '@root/src/shared/storages/dappsStorage';
import requestsStorage, { WcRequest } from '@root/src/shared/storages/requestsStorage';
import dappsStorage from '@root/src/shared/storages/dappsStorage';
import txsStorage from '@root/src/shared/storages/txsStorage';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';
import { OP_STACK_CHAINS } from '@root/src/shared/config/chains';
import { encodeFunctionData } from 'viem';
import { OptimismPortalAbi } from '@root/src/abis/OptimismPortal';

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
  const signClient = await SignClient.init({
    projectId: walletConnectProjectId,
    // optional parameters
    metadata: {
      name: 'Escape Hatch',
      description: 'Example Dapp',
      url: '#',
      icons: ['https://walletconnect.com/walletconnect-logo.png'],
    },
  });

  /**
   * WalletConnect
   */

  // Initialise WC state from saved state

  const savedSessions = await sessionsStorage.get();
  const savedDapps = await dappsStorage.get();

  requestsStorage.set(signClient.pendingRequest.getAll());
  sessionsStorage.set(signClient.session.getAll().filter(x => !savedDapps.find(s => s.topic === x.topic)));
  dappsStorage.set(signClient.session.getAll().filter(x => !savedSessions.find(s => s.topic === x.topic)));

  // Listeners

  signClient.on('session_proposal', async event => {
    // Show session proposal data to the user i.e. in a modal with options to approve / reject it
    const [walletSession] = signClient.session.getAll();
    // Approve session proposal, use id from session proposal event and respond with namespace(s) that satisfy dapps request and contain approved accounts
    const { acknowledged } = await signClient.approve({
      id: event.id,
      namespaces: walletSession.namespaces,
    });
    const session = await acknowledged();
    dappsStorage.add(session);
  });

  signClient.on('session_event', event => {
    console.log('session_event', event);
  });

  // Handle dapp request, if we need to rewrite and prompt for confirmation
  signClient.on('session_request', async event => {
    console.log('session_request', event);

    const sessions = await sessionsStorage.get();
    const session = sessions.find(x => x.topic !== event.topic);

    const [, chainId] = event.params.chainId.split(':');
    const config = OP_STACK_CHAINS.find(x => x.l2.id === parseInt(chainId));

    if (event.params.request.method === 'eth_sendTransaction' && config && session) {
      console.log('Rewriting to', session.peer.metadata.name);
      requestsStorage.add(event);

      await chrome.windows.create({
        url: chrome.runtime.getURL('src/pages/popup/index.html'),
        type: 'popup',
        width: 300,
        height: 300,
        top: 0,
      });
      return;
    }

    console.log('Sending to', session.peer.metadata.name);
    return signClient.request({
      chainId: event.params.chainId,
      request: event.params.request,
      topic: session.topic,
    });
  });

  signClient.on('session_delete', event => {
    // React to session delete event
    dappsStorage.remove(event.topic);
    sessionsStorage.remove(event.topic);
  });

  signClient.on('session_update', ({ topic, params }) => {
    const { namespaces } = params;
    const _session = signClient.session.get(topic);
    const updatedSession = { ..._session, namespaces };
    sessionsStorage.update(topic, updatedSession);
  });

  /**
   * Popup communication
   */

  // Handle dapp URI from popup
  popupMessenger.reply('pair', async (uri: string) => signClient.core.pairing.pair({ uri }));

  // Handle MM bound tx confirmation
  popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
    inPageMessenger.send('confirm', tx);
  });

  // Handle MM bound tx rejection
  popupMessenger.reply('reject', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
  });

  // Handle WC tx confirmation
  popupMessenger.reply('wc-confirm', async (event: WcRequest) => {
    requestsStorage.remove(event);

    const [, chainId] = event.params.chainId.split(':');
    const config = OP_STACK_CHAINS.find(x => x.l2.id === parseInt(chainId));

    const sessions = await sessionsStorage.get();
    const session = sessions.find(x => x.topic !== event.topic);

    if (config && session) {
      const [tx] = event.params.request.params;
      return signClient.request({
        chainId: `eip155:${config.l2.id}`,
        topic: session.topic,
        request: {
          method: 'eth_sendTransaction',
          params: [
            {
              to: config.contractAddresses.optimismPortal,
              from: tx.from,
              data: encodeFunctionData({
                abi: OptimismPortalAbi,
                functionName: 'depositTransaction',
                args: [
                  tx.to, // _to
                  tx.value ? BigInt(parseInt(tx.value)) : BigInt('0'), // _value
                  BigInt(200_000),
                  false, // _isCreation, not supported for now
                  tx.data, // _data
                ],
              }),
            },
          ],
        },
      });
    }
  });

  popupMessenger.reply('wc-reject', async (event: WcRequest) => {
    requestsStorage.remove(event);
    signClient.reject({ id: event.id, reason: { code: 1, message: 'User rejected' } });
  });

  // disconnect WC wallet
  popupMessenger.reply('disconnect-wallet', async ({ session }) => {
    console.log('on disconnect wallet');
    await signClient
      .disconnect({ topic: session.topic, reason: { code: 1, message: 'User disconnected' } })
      .catch(() => null);
    sessionsStorage.remove(session.topic);
    popupMessenger.send('rerender', {});
  });

  // disconnect WC app
  popupMessenger.reply('disconnect-app', async ({ session }) => {
    console.log('on disconnect app');
    await signClient
      .disconnect({ topic: session.topic, reason: { code: 1, message: 'User disconnected' } })
      .catch(() => null);
    appsStorage.remove(session.topic);
    popupMessenger.send('rerender', {});
  });

  // connect wallet flow
  popupMessenger.reply('init', async args => {
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
          chains: ['eip155:1'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
      optionalNamespaces: {
        eip155: {
          methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
          chains: OP_STACK_CHAINS.flatMap(config => [`eip155:${config.l1.id}`, `eip155:${config.l2.id}`]),
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    });

    // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
    if (uri) {
      popupMessenger.send('uri', uri);
      const session = await approval();
      sessionsStorage.add(session);
      popupMessenger.send('rerender', {});
    }
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
