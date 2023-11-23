import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';
import useStorage from '@src/shared/hooks/useStorage';
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';
import { useEffect, useState } from 'react';
import logo from '@assets/img/logo.svg';
import logoColour from '@assets/img/logo-colour.svg';

const Popup = () => {
  const [pending, setPending] = useState<any[]>([]);

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

  useEffect(() => {
    chrome.storage.local.get({ signRequests: [] }, ({ signRequests }) => {
      console.log('>>>', signRequests);
      setPending(signRequests.map(tx => JSON.parse(tx)));
    });
  }, []);

  return (
    <div className="flex flex-col bg-black p-6 gap-y-4">
      <div className="bg-white rounded-xl flex items-center justify-between py-4 pl-6 pr-6">
        <img src={logo} style={{ width: 37.1, height: 24 }} className="" />
        <div className="flex items-center gap-4">
          <a href="https://twitter.com/superbridgeapp">X.COM</a>
          <a>DOCS</a>
        </div>
      </div>

      <div className="flex items-center flex-col bg-white rounded-xl pt-12 px-6 pb-8 gap-y-6">
        <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
        <div className="text-center text-lg font-bold">
          Would you like to use the Escape Hatch for this transaction?
        </div>

        <div className="flex items-center gap-4 font-bold w-full">
          <button className="py-4 px-6 rounded-full ring-2 ring-zinc-900 ring-inset  w-full">No</button>
          <button className="py-4 px-6 bg-zinc-900 text-white rounded-full  w-full">Yes</button>
        </div>
      </div>

      <div className="flex items-center flex-col bg-white rounded-xl pt-12 px-6 pb-8 gap-y-6">
        <img src={logoColour} style={{ width: 136.02, height: 88 }} className="" />
        <div className="text-center text-lg font-bold">
          Connect to the
          <br />
          Escape Hatch
        </div>

        <div className="flex items-center gap-4 font-bold w-full">
          <button className="py-4 px-6 bg-zinc-900 text-white rounded-full w-full">Connect</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Pending transactions</div>

        {pending.length === 0 ? (
          <div className="text-zinc-400">No transactions yet…</div>
        ) : (
          <>
            {pending.map((p, index) => (
              <>
                <div>Index: {index}</div>
                <div>
                  <button onClick={() => onClick(p, true)}>Yes</button>
                  <button onClick={() => onClick(p, false)}>No</button>
                </div>
              </>
            ))}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 gap-2">
        <div>Current connections</div>

        <div className="text-zinc-400">No connected wallets yet…</div>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
