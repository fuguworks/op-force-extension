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

const sessionsStorage: TxsStorage = {
  ...storage,
  add: tx => {
    storage.set(txs => [...txs, tx]);
  },
  remove: tx => {
    storage.set(txs => txs.filter(x => JSON.stringify(tx) !== JSON.stringify(x)));
  },
};

export default sessionsStorage;
