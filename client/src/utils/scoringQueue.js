const DB_NAME = 'gullycric-offline-scoring';
const DB_VERSION = 1;
const STORE_NAME = 'scoringEvents';

let dbPromise;

const openQueueDb = () => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.objectStoreNames.contains(STORE_NAME)
        ? request.transaction.objectStore(STORE_NAME)
        : db.createObjectStore(STORE_NAME, { keyPath: 'id' });

      if (!store.indexNames.contains('matchId')) {
        store.createIndex('matchId', 'matchId');
      }

      if (!store.indexNames.contains('synced')) {
        store.createIndex('synced', 'synced');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

const runStoreRequest = async (mode, callback) => {
  const db = await openQueueDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const createScoringEventId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const enqueueScoringEvent = (event) =>
  runStoreRequest('readwrite', (store) => store.put(event));

export const markScoringEventSynced = (event) =>
  runStoreRequest('readwrite', (store) =>
    store.put({
      ...event,
      synced: true,
      syncedAt: Date.now(),
    })
  );

export const getQueuedScoringEvents = async (matchId, { includeSynced = false } = {}) => {
  const events = await runStoreRequest('readonly', (store) => store.getAll());

  return events
    .filter((event) => event.matchId === matchId && (includeSynced || !event.synced))
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const countPendingScoringEvents = async (matchId) => {
  const events = await getQueuedScoringEvents(matchId);
  return events.length;
};
