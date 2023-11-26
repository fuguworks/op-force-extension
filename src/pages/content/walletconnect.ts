import { walletConnectProjectId } from '@root/src/shared/config/constants';
import SignClient from '@walletconnect/sign-client';
import { initializeMessenger } from '@root/src/messengers';
import sessionsStorage from '@root/src/shared/storages/sessionsStorage';

const messenger = initializeMessenger({ connect: 'popup' });

async function init() {
  const signClient = await SignClient.init({
    projectId: walletConnectProjectId,
    // optional parameters
    metadata: {
      name: 'Example Dapp',
      description: 'Example Dapp',
      url: '#',
      icons: ['https://walletconnect.com/walletconnect-logo.png'],
    },
  });

  messenger.reply('disconnect', async ({ session }) => {
    console.log('on disconnect');
    await signClient.disconnect({ topic: session.topic, reason: '' }).catch(() => null);
    sessionsStorage.removeSession(session.topic);
    messenger.send('rerender', {});
  });

  signClient.on('session_event', ({}) => {
    // Handle session events, such as "chainChanged", "accountsChanged", etc.
  });

  signClient.on('session_update', ({ topic, params }) => {
    const { namespaces } = params;
    const _session = signClient.session.get(topic);
    const updatedSession = { ..._session, namespaces };
    sessionsStorage.updateSession(topic, updatedSession);
  });

  signClient.on('session_delete', s => {
    sessionsStorage.removeSession(s.topic);
  });

  messenger.reply('init', async args => {
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
        messenger.send('uri', { uri });
        const session = await approval();
        sessionsStorage.addSession(session);

        messenger.send('connect', { session });
      }
    } catch (e) {
      console.error(e);
    }
  });
}

init();
