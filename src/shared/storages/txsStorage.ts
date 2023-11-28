import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

import { MetamaskTransactionRequest } from '../config/types';

type Txs = MetamaskTransactionRequest[];

type TxsStorage = BaseStorage<Txs> & {
  add: (tx: MetamaskTransactionRequest) => void;
  remove: (tx: MetamaskTransactionRequest) => void;
};

const storage = createStorage<Txs>('txs', [], {
  storageType: StorageType.Local,
});

/**
 * Enables somewhat deterministic JSON.stringify comparisons
 */
const replacer = (key: string, value: any) =>
  value instanceof Object && !(value instanceof Array)
    ? Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {})
    : value;

const sessionsStorage: TxsStorage = {
  ...storage,
  add: tx => {
    storage.set(txs => [...txs, tx]);
  },
  remove: tx => {
    storage.set(txs => txs.filter(x => JSON.stringify(tx, replacer) !== JSON.stringify(x, replacer)));
  },
};

export default sessionsStorage;
