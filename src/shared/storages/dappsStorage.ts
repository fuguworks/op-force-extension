import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';
import { SessionTypes } from '@walletconnect/types';

type Dapps = SessionTypes.Struct[];

type DappsStorage = BaseStorage<Dapps> & {
  add: (s: SessionTypes.Struct) => void;
  update: (topic: string, s: SessionTypes.Struct) => void;
  remove: (topic: string) => void;
};

const storage = createStorage<Dapps>('dapps', [], {
  storageType: StorageType.Local,
});

const dappsStorage: DappsStorage = {
  ...storage,
  add: session => {
    storage.set(sessions => [...sessions, session]);
  },
  remove: topic => {
    storage.set(sessions => sessions.filter(x => x.topic !== topic));
  },
  update: (topic, s) => {
    storage.set(sessions => sessions.map(x => (x.topic === topic ? s : x)));
  },
};

export default dappsStorage;
