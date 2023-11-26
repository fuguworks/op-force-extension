import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';
import { SignClientTypes } from '@walletconnect/types';

type Requests = SignClientTypes.BaseEventArgs[];

type RequestsStorage = BaseStorage<Requests> & {
  add: (r: SignClientTypes.BaseEventArgs) => void;
  update: (topic: string, r: SignClientTypes.BaseEventArgs) => void;
  remove: (r: SignClientTypes.BaseEventArgs) => void;
};

const storage = createStorage<Requests>('requests', [], {
  storageType: StorageType.Local,
});

const requestsStorage: RequestsStorage = {
  ...storage,
  add: r => {
    storage.set(rs => [...rs, r]);
  },
  remove: ({ id }) => {
    storage.set(requests => requests.filter(x => x.id !== id));
  },
  update: (topic, s) => {
    storage.set(requests => requests.map(x => (x.topic === topic ? s : x)));
  },
};

export default requestsStorage;
