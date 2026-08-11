(function () {
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const isObject = value => value && typeof value === "object" && !Array.isArray(value);

  function mergeAppendOnlyHistory(base, local, remote) {
    const fingerprint = entry => JSON.stringify(entry);
    const baseFingerprints = new Set((base || []).map(fingerprint));
    const localFingerprints = new Set(local.map(fingerprint));
    const remoteFingerprints = new Set(remote.map(fingerprint));
    if (![...baseFingerprints].every(value => localFingerprints.has(value) && remoteFingerprints.has(value))) return null;
    const additions = [...local.filter(entry => !baseFingerprints.has(fingerprint(entry))), ...remote.filter(entry => !baseFingerprints.has(fingerprint(entry)))];
    const seen = new Set();
    return [...additions, ...(base || [])].filter(entry => { const key=fingerprint(entry);if(seen.has(key))return false;seen.add(key);return true; });
  }

  function mergeNode(base, local, remote, path, conflicts) {
    if (equal(local, remote)) return clone(local);
    if (equal(local, base)) return clone(remote);
    if (equal(remote, base)) return clone(local);

    if (Array.isArray(local) && Array.isArray(remote)) {
      if (path === "history") {
        const mergedHistory = mergeAppendOnlyHistory(Array.isArray(base) ? base : [], local, remote);
        if (mergedHistory) return clone(mergedHistory);
      }
      const keyed = [...local, ...remote, ...(Array.isArray(base) ? base : [])]
        .every(entry => isObject(entry) && entry.id != null);
      if (!keyed) {
        conflicts.push({ path, base: clone(base), local: clone(local), remote: clone(remote) });
        return clone(local);
      }
      const baseMap = new Map((base || []).map(entry => [String(entry.id), entry]));
      const localMap = new Map(local.map(entry => [String(entry.id), entry]));
      const remoteMap = new Map(remote.map(entry => [String(entry.id), entry]));
      const ids = [...new Set([...baseMap.keys(), ...localMap.keys(), ...remoteMap.keys()])];
      return ids.flatMap(id => {
        const b = baseMap.get(id), l = localMap.get(id), r = remoteMap.get(id);
        if (l === undefined && r === undefined) return [];
        if (b === undefined && l !== undefined && r === undefined) return [clone(l)];
        if (b === undefined && l === undefined && r !== undefined) return [clone(r)];
        if (l === undefined) {
          if (equal(r, b)) return [];
          conflicts.push({ path: `${path}[${id}]`, base: clone(b), local: undefined, remote: clone(r) });
          return [];
        }
        if (r === undefined) {
          if (equal(l, b)) return [];
          conflicts.push({ path: `${path}[${id}]`, base: clone(b), local: clone(l), remote: undefined });
          return [clone(l)];
        }
        return [mergeNode(b, l, r, `${path}[${id}]`, conflicts)];
      });
    }

    if (isObject(local) && isObject(remote)) {
      const result = {};
      const keys = new Set([...Object.keys(base || {}), ...Object.keys(local), ...Object.keys(remote)]);
      keys.forEach(key => {
        const value = mergeNode(base?.[key], local[key], remote[key], path ? `${path}.${key}` : key, conflicts);
        if (value !== undefined) result[key] = value;
      });
      return result;
    }

    conflicts.push({ path, base: clone(base), local: clone(local), remote: clone(remote) });
    return clone(local);
  }

  function mergeSharedData(base, local, remote) {
    const conflicts = [];
    const data = mergeNode(base || {}, local || {}, remote || {}, "", conflicts);
    return { data, conflicts };
  }

  function createSaveCoordinator(options) {
    let revision = 0;
    let savedRevision = 0;
    let running = null;
    let sha = options.initialSha || null;
    let base = clone(options.initialBase || null);
    let latestSnapshot = clone(options.initialBase || null);
    let stoppedByConflict = false;

    async function drain() {
      while (savedRevision < revision && !stoppedByConflict) {
        const targetRevision = revision;
        let snapshot = clone(latestSnapshot);
        options.onStatus?.("saving");
        try {
          sha = await options.save(snapshot, sha);
          base = clone(snapshot);
          savedRevision = targetRevision;
          await options.onSaved?.({ data: clone(snapshot), sha, revision: savedRevision, pending: savedRevision < revision });
        } catch (error) {
          if (error?.code !== "GITHUB_CONFLICT" && error?.status !== 409) {
            options.onStatus?.("error", error);
            throw error;
          }
          const remote = await options.loadRemote();
          const merged = mergeSharedData(base, snapshot, remote.data);
          sha = remote.sha;
          if (merged.conflicts.length) {
            stoppedByConflict = true;
            options.onConflict?.({ ...merged, local: snapshot, remote: remote.data, base, sha });
            options.onStatus?.("conflict");
            return;
          }
          const localAtConflict = clone(snapshot);
          const mergedSnapshot = clone(merged.data);
          sha = await options.save(mergedSnapshot, sha);
          base = clone(mergedSnapshot);
          savedRevision = targetRevision;
          if (revision > targetRevision) {
            const rebasedPending = mergeSharedData(localAtConflict, latestSnapshot, mergedSnapshot);
            if (rebasedPending.conflicts.length) {
              stoppedByConflict = true;
              options.onConflict?.({ ...rebasedPending, local: clone(latestSnapshot), remote: mergedSnapshot, base: localAtConflict, sha });
              options.onStatus?.("conflict");
              return;
            }
            latestSnapshot = rebasedPending.data;
          } else {
            latestSnapshot = mergedSnapshot;
          }
          await options.onMerged?.({ data: clone(mergedSnapshot), sha });
          await options.onSaved?.({ data: clone(mergedSnapshot), sha, revision: savedRevision, pending: savedRevision < revision });
        }
      }
      options.onStatus?.(savedRevision === revision ? "saved" : "unsynced");
    }

    return {
      enqueue(data) {
        latestSnapshot = clone(data);
        revision += 1;
        stoppedByConflict = false;
        if (!running) running = drain().finally(() => { running = null; });
        return running;
      },
      getState: () => ({ revision, savedRevision, sha, base: clone(base), pending: savedRevision < revision, running: Boolean(running) })
    };
  }

  window.ExadexSharedSync = { mergeSharedData, createSaveCoordinator };
})();
