import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';
import { SignClientTypes } from '@walletconnect/types';

export type WcRequest = SignClientTypes.BaseEventArgs<{
  request: {
    method: string;
    params: any;
  };
  chainId: string;
}>;

type Requests = WcRequest[];

type RequestsStorage = BaseStorage<Requests> & {
  add: (r: WcRequest) => void;
  update: (topic: string, r: WcRequest) => void;
  remove: (r: WcRequest) => void;
  set: (r: WcRequest[]) => void;
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
