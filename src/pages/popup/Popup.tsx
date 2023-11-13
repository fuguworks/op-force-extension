import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';
import useStorage from '@src/shared/hooks/useStorage';
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';
import { useEffect, useState } from 'react';

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
    <div>
      <div>{pending.length} pending transactions</div>
      {pending.map((p, index) => (
        <>
          <div>Index: {index}</div>
          <div>
            <button onClick={() => onClick(p, true)}>Yes</button>
            <button onClick={() => onClick(p, false)}>No</button>
          </div>
        </>
      ))}
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
