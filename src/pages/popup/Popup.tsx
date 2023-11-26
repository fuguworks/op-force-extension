import logoColour from '@assets/img/logo-colour.svg';
import logo from '@assets/img/logo.svg';
import { initializeMessenger } from '@root/src/messengers';
import { walletConnectProjectId } from '@root/src/shared/config/constants';
import useStorage from '@root/src/shared/hooks/useStorage';
import sessionsStorage from '@root/src/shared/storages/sessionsStorage';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';
import { WalletConnectModal } from '@walletconnect/modal';
import { SessionTypes } from '@walletconnect/types';
import { useEffect, useState } from 'react';
import { Loading } from './Loader';

const walletConnectModal = new WalletConnectModal({
  projectId: walletConnectProjectId,
  chains: ['eip155:1'],
});

const messenger = initializeMessenger({ connect: 'contentScript' });

const Popup = () => {
  const sessions = useStorage(sessionsStorage);
  const [pending, setPending] = useState<any[]>([]);

  // We don't get notified when storage changes, so this listener
  // is a hack
  const [rerender, setRerender] = useState(0);
  const onRerender = () => setRerender(r => r + 1);

  useEffect(() => {
    console.log('Setting up ubscriptions');
    const unsubUri = messenger.reply('uri', ({ uri }) => {
      console.log('reply(uri)', uri);
      walletConnectModal.openModal({ uri });
    });
    const unsubConnect = messenger.reply('connect', ({ session }) => {
      console.log('connect', session);
      walletConnectModal.closeModal();
      onRerender();
    });
    const unsubRender = messenger.reply('rerender', () => {
      onRerender();
    });

    return () => {
      unsubUri();
      unsubConnect();
      unsubRender();
    };
  }, []);

  const onClick = async (transaction: any, value: boolean) => {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      await chrome.tabs
        .sendMessage(tab.id, { target: 'op-extension', value, transaction: JSON.stringify(transaction) })
        .catch(() => null);
    }

    chrome.storage.local.set({ signRequests: [] });
    setPending([]);
    window.close();
  };

  const onDisconnect = async (session: SessionTypes.Struct) => {
    messenger.send('disconnect', { session });
  };

  useEffect(() => {
    chrome.storage.local.get({ signRequests: [] }, ({ signRequests }) => {
      setPending(signRequests.map(tx => JSON.parse(tx)));
      setPending([]);
    });
  }, []);

  const activeRequest = pending[0];

  return (
    <div className="flex flex-col bg-black p-6 gap-y-4">
      <div className="bg-white rounded-xl flex items-center justify-between py-4 pl-6 pr-6">
        <img src={logo} style={{ width: 37.1, height: 24 }} className="" />
        <div className="flex items-center gap-4">
          <a href="https://twitter.com/superbridgeapp">X.COM</a>
          <a>DOCS</a>
        </div>
      </div>

      {activeRequest ? (
        <div className="flex items-center flex-col bg-white rounded-xl pt-12 px-6 pb-8 gap-y-6">
          <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
          <div className="text-center text-lg font-bold">
            Would you like to use the Escape Hatch for this transaction?
          </div>

          <div className="flex items-center gap-4 font-bold w-full">
            <button
              className="py-4 px-6 rounded-full ring-2 ring-zinc-900 ring-inset w-full"
              onClick={() => onClick(activeRequest, true)}>
              No
            </button>
            <button
              className="py-4 px-6 bg-zinc-900 text-white rounded-full w-full"
              onClick={() => onClick(activeRequest, false)}>
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
              onClick={() => {
                console.log('sending init');
                messenger.send('init', {});
              }}>
              Connect
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Pending transactions</div>

        {pending.length === 0 ? (
          <div className="text-zinc-400">No transactions yet…</div>
        ) : (
          <>
            {pending.map((p, index) => (
              <div className="flex items-center gap-2 bg-blue-100 rounded-full w-full">
                <Loading />
                <div className="font-bold text-xs text-blue-500 p-2 pr-3">Decoded tx info</div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Current connections</div>

        {sessions.length === 0 ? (
          <div className="text-zinc-400">No connected wallets yet…</div>
        ) : (
          <>
            {sessions.map(s => (
              <div className="flex bg-zinc-100 p-2 items-center gap-2 rounded-full  ">
                <img className="h-4 w-4 rounded-full" src={s.peer.metadata.icons[0]} />
                <div>{s.peer.metadata.name}</div>

                <button className="ml-auto" onClick={() => onDisconnect(s)}>
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

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
