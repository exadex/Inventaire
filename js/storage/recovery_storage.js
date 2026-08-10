(function () {
  const DB_NAME = "exadex-inventory-recovery";
  const STORE = "snapshots";
  const CURRENT = "current";
  const FALLBACK_KEY = "exadex_inventory_recovery_snapshot";
  let writeQueue = Promise.resolve();

  const readFallback = () => {
    try { return JSON.parse(localStorage.getItem(FALLBACK_KEY) || "null"); }
    catch { return null; }
  };
  const writeFallback = record => {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(record));
    return record;
  };

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function transact(mode, callback) {
    if (!window.indexedDB) {
      const fallbackStore = {
        get: () => ({ result: readFallback() }),
        put: record => ({ result: writeFallback(record) })
      };
      return callback(fallbackStore).result;
    }
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = callback(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  function save(snapshot) {
    const record = { id: CURRENT, ...snapshot, modifiedAt: snapshot.modifiedAt || new Date().toISOString(), unsynced: true };
    writeQueue = writeQueue.catch(() => null).then(async () => {
      await transact("readwrite", store => store.put(record));
      return record;
    });
    return writeQueue;
  }

  const load = () => transact("readonly", store => store.get(CURRENT));

  function markSynced(details = {}) {
    writeQueue = writeQueue.catch(() => null).then(async () => {
      const current = await load();
      if (!current) return null;
      const record = { ...current, ...details, id: CURRENT, unsynced: false, syncedAt: new Date().toISOString() };
      await transact("readwrite", store => store.put(record));
      return record;
    });
    return writeQueue;
  }

  function download(record) {
    const blob = new Blob([JSON.stringify(record.data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
    link.href = URL.createObjectURL(blob);
    link.download = `inventaire-recuperation-${stamp}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  window.ExadexRecoveryStorage = { save, load, markSynced, download };
})();
