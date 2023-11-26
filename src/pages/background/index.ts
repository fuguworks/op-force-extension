import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

import { walletConnectProjectId } from '@root/src/shared/config/constants';
import SignClient from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';
import { initializeMessenger } from '@root/src/messengers';
import sessionsStorage from '@root/src/shared/storages/sessionsStorage';
import requestsStorage from '@root/src/shared/storages/requestsStorage';
import dappsStorage from '@root/src/shared/storages/dappsStorage';
import txsStorage from '@root/src/shared/storages/txsStorage';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';
import { OP_STACK_CHAINS } from '@root/src/shared/config/chains';
import { encodeFunctionData } from 'viem';
import { OptimismPortalAbi } from '@root/src/abis/OptimismPortal';

reloadOnUpdate('pages/background/index.ts');

console.log('loading background fff');

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

  signClient.on('session_proposal', async event => {
    // Show session proposal data to the user i.e. in a modal with options to approve / reject it

    const [walletSession] = signClient.session.getAll();
    console.log('paired');
    // Approve session proposal, use id from session proposal event and respond with namespace(s) that satisfy dapps request and contain approved accounts
    const { topic, acknowledged } = await signClient.approve({
      id: event.id,
      namespaces: walletSession.namespaces,
    });
    console.log('approved');
    // Optionally await acknowledgement from dapp
    const session = await acknowledged();
    console.log('session', session);

    dappsStorage.add(session);
  });

  signClient.on('session_event', event => {
    // Handle session events, such as "chainChanged", "accountsChanged", etc.
  });

  signClient.on('session_request', async event => {
    console.log('session_request', event);

    const sessions = await sessionsStorage.get();
    const session = sessions.find(x => x.topic !== event.topic);

    const [, chainId] = event.params.chainId.split(':');

    if (event.params.request.method === 'eth_sendTransaction') {
      const config = OP_STACK_CHAINS.find(x => x.l2.id === parseInt(chainId));
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

      // return originalRequest({ method: 'eth_sendTransaction', params: [tx] });
    }
    if (session) {
      return signClient.request({
        chainId: event.params.chainId,
        request: event.params.request,
        topic: session.topic,
      });
    }

    // Handle session method requests, such as "eth_sign", "eth_sendTransaction", etc.
  });

  signClient.on('session_delete', event => {
    // React to session delete event

    interface Event {
      id: number;
      topic: string;
    }
  });

  popupMessenger.reply('pair', async ({ uri }) => {
    console.log('pairing', uri);

    await signClient.core.pairing.pair({ uri });
  });

  popupMessenger.reply('init', async args => {
    try {
      const { uri, approval } = await signClient.connect({
        // Optionally: pass a known prior pairing (e.g. from `signClient.core.pairing.getPairings()`) to skip the `uri` step.
        // pairingTopic: pairing?.topic,
        // Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
        requiredNamespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
            chains: ['eip155:1'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        popupMessenger.send('uri', { uri });
        const session = await approval();
        sessionsStorage.add(session);

        popupMessenger.send('connect', { session });
      }
    } catch (e) {
      console.error(e);
    }
  });

  inPageMessenger.reply('sign-request', async (tx: MetamaskTransactionRequest) => {
    txsStorage.add(tx);
  });

  popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
    inPageMessenger.send('confirm', tx);
  });

  popupMessenger.reply('reject', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
  });

  popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
    try {
      txsStorage.remove(tx);
      const [session] = signClient.session.getAll();
      if (session) {
        // wc
        const result = await signClient.request({
          topic: session.topic,
          chainId: 'eip155:1',
          request: {
            method: 'personal_sign',
            params: [
              '0x7468697320697320612074657374206d65737361676520746f206265207369676e6564',
              '0x1d85568eEAbad713fBB5293B45ea066e552A90De',
            ],
          },
        });
      } else {
        // metamask

        inPageMessenger.send('confirm', tx);
      }
    } catch (e) {
      console.error(e);
    }
  });

  popupMessenger.reply('disconnect', async ({ session }) => {
    console.log('on disconnect');
    await signClient.disconnect({ topic: session.topic, reason: '' }).catch(() => null);
    sessionsStorage.remove(session.topic);
    popupMessenger.send('rerender', {});
  });

  signClient.on('session_event', ({}) => {
    // Handle session events, such as "chainChanged", "accountsChanged", etc.
  });

  // signClient.on('session_request', request => {
  //   requestsStorage.add(request);
  //   // Handle session events, such as "chainChanged", "accountsChanged", etc.
  // });

  signClient.on('session_update', ({ topic, params }) => {
    const { namespaces } = params;
    const _session = signClient.session.get(topic);
    const updatedSession = { ..._session, namespaces };
    sessionsStorage.update(topic, updatedSession);
  });

  signClient.on('session_delete', s => {
    sessionsStorage.remove(s.topic);
  });

  popupMessenger.reply('init', async args => {
    try {
      const { uri, approval } = await signClient.connect({
        // Optionally: pass a known prior pairing (e.g. from `signClient.core.pairing.getPairings()`) to skip the `uri` step.
        // pairingTopic: pairing?.topic,
        // Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
        requiredNamespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
            chains: ['eip155:1'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        popupMessenger.send('uri', { uri });
        const session = await approval();
        sessionsStorage.add(session);

        popupMessenger.send('connect', { session });
      }
    } catch (e) {
      console.error(e);
    }
  });

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

  popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
    inPageMessenger.send('confirm', tx);
  });

  popupMessenger.reply('reject', async (tx: MetamaskTransactionRequest) => {
    txsStorage.remove(tx);
  });

  popupMessenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
    try {
      txsStorage.remove(tx);
      const [session] = signClient.session.getAll();
      if (session) {
        // wc
        const result = await signClient.request({
          topic: session.topic,
          chainId: 'eip155:1',
          request: {
            method: 'personal_sign',
            params: [
              '0x7468697320697320612074657374206d65737361676520746f206265207369676e6564',
              '0x1d85568eEAbad713fBB5293B45ea066e552A90De',
            ],
          },
        });
      } else {
        // metamask

        inPageMessenger.send('confirm', tx);
      }
    } catch (e) {
      console.error(e);
    }
  });
}

init();
