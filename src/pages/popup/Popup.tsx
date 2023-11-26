import { useEffect, useState } from 'react';

import { WalletConnectModal } from '@walletconnect/modal';
import { SessionTypes, SignClientTypes } from '@walletconnect/types';

import logoColour from '@assets/img/logo-colour.svg';
import logo from '@assets/img/logo.svg';
import { initializeMessenger } from '@root/src/messengers';
import { walletConnectProjectId } from '@root/src/shared/config/constants';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';
import useStorage from '@root/src/shared/hooks/useStorage';
import requestsStorage from '@root/src/shared/storages/requestsStorage';
import sessionsStorage from '@root/src/shared/storages/sessionsStorage';
import dappsStorage from '@root/src/shared/storages/dappsStorage';
import txsStorage from '@root/src/shared/storages/txsStorage';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';

import { Loading } from './Loader';

const walletConnectModal = new WalletConnectModal({
  projectId: walletConnectProjectId,
  chains: ['eip155:1'],
});

const messenger = initializeMessenger({ connect: 'background' });

const Popup = () => {
  const [uri, setUri] = useState('');

  const wcSessions = useStorage(sessionsStorage);
  const dapps = useStorage(dappsStorage);
  const wcRequests = useStorage(requestsStorage);
  const txs = useStorage(txsStorage);

  // We don't get notified when storage changes, so this listener
  // is a hack
  const [rerender, setRerender] = useState(0);
  const onRerender = () => {
    walletConnectModal.closeModal();
    setRerender(r => r + 1);
  };

  useEffect(() => {
    const unsubUri = messenger.reply('uri', async (uri: string) => {
      walletConnectModal.openModal({ uri });
    });
    const unsubRender = messenger.reply('rerender', async () => {
      onRerender();
    });

    return () => {
      unsubUri();
      unsubRender();
    };
  }, []);

  const onMetaMaskClick = async (transaction: MetamaskTransactionRequest, value: boolean) => {
    messenger.send(value ? 'confirm' : 'reject', transaction);
    window.close();
  };

  const onWalletConnectClick = async (transaction: SignClientTypes.BaseEventArgs, value: boolean) => {
    messenger.send(value ? 'wc-confirm' : 'wc-reject', transaction);
    window.close();
  };

  const onDisconnectWallet = async (session: SessionTypes.Struct) => {
    messenger.send('disconnect-wallet', { session });
  };

  const onDisconnectApp = async (session: SessionTypes.Struct) => {
    messenger.send('disconnect-app', { session });
  };

  const onConnectWc = () => {
    if (!uri) {
      return;
    }
    messenger.send('pair', uri);
    setUri('');
  };

  const activeWcRequest = wcRequests[0];
  const activeExtensionRequest = txs[0];

  return (
    <div className="flex flex-col bg-black p-6 gap-y-4">
      <div className="bg-white rounded-xl flex items-center justify-between py-4 pl-6 pr-6">
        <img src={logo} style={{ width: 37.1, height: 24 }} className="" />
        <div className="flex items-center gap-4">
          <a href="https://twitter.com/superbridgeapp">X.COM</a>
          <a>DOCS</a>
        </div>
      </div>

      {activeExtensionRequest || activeWcRequest ? (
        <div className="flex items-center flex-col bg-white rounded-xl pt-12 px-6 pb-8 gap-y-6">
          <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
          <div className="text-center text-lg font-bold">
            Would you like to use the Escape Hatch for this transaction?
          </div>

          <div className="flex items-center gap-4 font-bold w-full">
            <button
              className="py-4 px-6 rounded-full ring-2 ring-zinc-900 ring-inset w-full"
              onClick={() =>
                activeExtensionRequest
                  ? onMetaMaskClick(activeExtensionRequest, true)
                  : onWalletConnectClick(activeWcRequest, true)
              }>
              No
            </button>
            <button
              className="py-4 px-6 bg-zinc-900 text-white rounded-full w-full"
              onClick={() =>
                activeExtensionRequest
                  ? onMetaMaskClick(activeExtensionRequest, false)
                  : onWalletConnectClick(activeWcRequest, false)
              }>
              Yes
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center flex-col bg-white rounded-xl pt-12 px-6 pb-8 gap-y-6">
          <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
          <div className="text-center text-lg font-bold">
            Connect to the
            <br />
            Escape Hatch
          </div>

          <div className="flex items-center gap-4 font-bold w-full">
            <button
              className="py-4 px-6 bg-zinc-900 text-white rounded-full w-full"
              onClick={() => messenger.send('init', {})}>
              Connect
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Pending transactions</div>

        {[...txs, ...wcRequests].length === 0 ? (
          <div className="text-zinc-400">No transactions yet…</div>
        ) : (
          <>
            {[...txs, ...wcRequests].map((p, index) => (
              <div className="flex items-center gap-2 bg-blue-100 rounded-full w-full">
                <Loading />
                <div className="font-bold text-xs text-blue-500 p-2 pr-3">Decoded tx info</div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Connect WC</div>

        <div>
          <input
            type="text"
            className="bg-zinc-100 w-full rounded-md p-2"
            value={uri}
            onChange={e => setUri(e.target.value)}
          />
          <button className="py-4 px-6 bg-zinc-900 text-white rounded-full w-full" onClick={onConnectWc}>
            Connect
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Current connections</div>

        {wcSessions.length === 0 ? (
          <div className="text-zinc-400">No connected wallets yet…</div>
        ) : (
          <>
            {wcSessions.map(s => (
              <div className="flex bg-zinc-100 p-2 items-center gap-2 rounded-full  ">
                <img className="h-4 w-4 rounded-full" src={s.peer.metadata.icons[0]} />
                <div>{s.peer.metadata.name}</div>

                <button className="ml-auto" onClick={() => onDisconnectWallet(s)}>
                  X
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Connected apps</div>

        {dapps.length === 0 ? (
          <div className="text-zinc-400">No connected apps yet…</div>
        ) : (
          <>
            {dapps.map(s => (
              <div className="flex bg-zinc-100 p-2 items-center gap-2 rounded-full  ">
                <img className="h-4 w-4 rounded-full" src={s.peer.metadata.icons[0]} />
                <div>{s.peer.metadata.name}</div>

                <button className="ml-auto" onClick={() => onDisconnectApp(s)}>
                  X
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occurred</div>);
