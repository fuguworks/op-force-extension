import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';
import { SessionTypes } from '@walletconnect/types';

type Sessions = SessionTypes.Struct[];

type SessionsStorage = BaseStorage<Sessions> & {
  addSession: (s: SessionTypes.Struct) => void;
  updateSession: (topic: string, s: SessionTypes.Struct) => void;
  removeSession: (topic: string) => void;
};

const storage = createStorage<Sessions>('sessions', [], {
  storageType: StorageType.Local,
});

const sessionsStorage: SessionsStorage = {
  ...storage,
  addSession: session => {
    storage.set(sessions => [...sessions, session]);
  },
  removeSession: topic => {
    storage.set(sessions => sessions.filter(x => x.topic !== topic));
  },
  updateSession: (topic, s) => {
    storage.set(sessions => sessions.map(x => (x.topic === topic ? s : x)));
  },
};

export default sessionsStorage;
