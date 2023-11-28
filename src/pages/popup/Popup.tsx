import { useEffect, useState } from 'react';

import background from '@assets/img/background.png';
import logoColour from '@assets/img/logo-colour.svg';
import logo from '@assets/img/logo.svg';
import { initializeMessenger } from '@root/src/messengers';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';
import useStorage from '@root/src/shared/hooks/useStorage';
import txsStorage from '@root/src/shared/storages/txsStorage';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';

import { Loading } from './Loader';

const messenger = initializeMessenger({ connect: 'background' });

const Popup = () => {
  const [uri, setUri] = useState('');

  const txs = useStorage(txsStorage);

  // We don't get notified when storage changes, so this listener
  // is a hack
  const [rerender, setRerender] = useState(0);
  const onRerender = () => {
    setRerender(r => r + 1);
  };

  useEffect(() => {
    const unsubRender = messenger.reply('rerender', async () => {
      onRerender();
    });

    return () => {
      unsubRender();
    };
  }, []);

  const onMetaMaskClick = async (transaction: MetamaskTransactionRequest, value: boolean) => {
    messenger.send(value ? 'confirm' : 'reject', transaction);
    window.close();
  };

  const activeExtensionRequest = txs[0];

  return (
    <div className="relative h-full">
      <img src={background} className="absolute h-full w-full" />
      <div className="relative z-10 flex flex-col  p-6 gap-y-4">
        <div className="bg-white rounded-xl flex items-center justify-between py-4 pl-6 pr-6">
          <img src={logo} style={{ width: 37.1, height: 24 }} className="" />
          <div className="flex items-center gap-4">
            <a href="https://twitter.com/superbridgeapp">X.COM</a>
            <a>DOCS</a>
          </div>
        </div>

        {activeExtensionRequest ? (
          <div className="flex items-center flex-col bg-white rounded-xl pt-12 px-6 pb-8 gap-y-6">
            <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
            <div className="text-center text-lg font-bold">
              Would you like to use the Escape Hatch for this transaction?
            </div>

            <div className="flex items-center gap-4 font-bold w-full">
              <button
                className="py-4 px-6 rounded-full ring-2 ring-zinc-900 ring-inset w-full"
                onClick={() => onMetaMaskClick(activeExtensionRequest, true)}>
                No
              </button>
              <button
                className="py-4 px-6 bg-zinc-900 text-white rounded-full w-full"
                onClick={() => onMetaMaskClick(activeExtensionRequest, false)}>
                Yes
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-col rounded-xl py-12 px-6 gap-y-6">
            <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
            <div className="text-center text-lg font-bold">
              Force L2 transactions
              <br />
              via Ethereum
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 gap-2">
          <div>Pending transactions</div>

          {txs.length === 0 ? (
            <div className="text-zinc-400">No transactions yet…</div>
          ) : (
            <>
              {txs.map((p, index) => (
                <div className="flex items-center gap-2 bg-blue-100 rounded-full w-full">
                  <Loading />
                  <div className="font-bold text-xs text-blue-500 p-2 pr-3">Decoded tx info</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occurred</div>);
