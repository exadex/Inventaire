(function () {
  const STORAGE_CONFIG_KEY = "exadex_github_storage_config";
  const TOKEN_KEY = "exadex_github_token";

  const CACHE_KEY = "exadex_shared_state_cache";
  const LOCAL_BACKUPS = [
    { name: "2026-08-10_18-15.json", path: "backups/inventory/2026-08-10_18-15.json", size: 0, type: "file", folder: "inventory", label: "Copie hebdomadaire de l'inventaire" },
    { name: "2026-08-10_18-15.json", path: "backups/full/2026-08-10_18-15.json", size: 0, type: "file", folder: "full", label: "Copie complète mensuelle" }
  ];
  let latestSha = null;

  function readJson(value, fallback = null) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function getConfig() {
    const inline = window.EXADEX_GITHUB_STORAGE || {};
    const stored = readJson(localStorage.getItem(STORAGE_CONFIG_KEY), {}) || {};

    return {
      owner: inline.owner || stored.owner || "",
      repo: inline.repo || stored.repo || "",
      branch: inline.branch || stored.branch || "main",
      path: inline.path || stored.path || "shared_data.json",
      token: inline.token || stored.token || localStorage.getItem(TOKEN_KEY) || ""
    };
  }

  function encodeBase64Utf8(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  function decodeBase64Utf8(value) {
    return decodeURIComponent(escape(atob(value)));
  }

  function configured(config) {
    return Boolean(config.owner && config.repo && config.path);
  }

  function encodePath(path) {
    return String(path).split("/").map(encodeURIComponent).join("/");
  }

  async function requestContents(config, options = {}) {
    const { fresh = true } = options;
    const baseUrl = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(config.path)}?ref=${encodeURIComponent(config.branch)}`;
    const url = fresh ? `${baseUrl}&t=${Date.now()}` : baseUrl;

    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };

    if (config.token) {
      headers.Authorization = `Bearer ${config.token}`;
    }

    const response = await fetch(url, {
      headers,
      cache: "no-store"
    });

    if (response.status === 404) {
      latestSha = null;
      return { data: null, sha: null };
    }

    if (!response.ok) {
      throw new Error(`GitHub read failed: ${response.status}`);
    }

    const payload = await response.json();
    const content = String(payload.content || "").replace(/\s/g, "");
    latestSha = payload.sha || null;

    return {
      data: readJson(decodeBase64Utf8(content), null),
      sha: latestSha
    };
  }

  async function requestPublicJson(config, options = {}) {
    const { fresh = true } = options;
    const path = config.path || "shared_data.json";
    const baseUrl = encodePath(path);
    const url = fresh ? `${baseUrl}?t=${Date.now()}` : baseUrl;

    const response = await fetch(url, {
      cache: "no-store"
    });

    if (response.status === 404) {
      return { data: null, sha: null };
    }

    if (!response.ok) {
      throw new Error(`Public shared data read failed: ${response.status}`);
    }

    return {
      data: await response.json(),
      sha: null
    };
  }

  async function loadSharedData(options = {}) {
    const config = getConfig();
    const shouldCache = options.cache !== false;

    if (!configured(config)) {
      const result = await requestPublicJson(config, options);

      if (result.data && shouldCache) {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: result.data,
            sha: result.sha,
            loadedAt: new Date().toISOString()
          })
        );
      }

      return { ...result, mode: "public-readonly" };
    }

    const result = await requestContents(config, options);

    if (shouldCache) {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: result.data,
          sha: result.sha,
          loadedAt: new Date().toISOString()
        })
      );
    }

    return {
      ...result,
      mode: config.token ? "github-write" : "github-readonly"
    };
  }

  async function saveSharedData(data, previousSha, options = {}) {
    const config = getConfig();

    if (!configured(config)) {
      throw new Error("GitHub storage is not configured.");
    }

    if (!config.token) {
      throw new Error("GitHub token is missing; shared data is read-only.");
    }

    const current = await requestContents(config, { fresh: true });
    const expectedSha = previousSha || latestSha;
    if (expectedSha && current.sha && expectedSha !== current.sha) {
      const conflict = new Error("GitHub data changed before this save. Reload and merge before saving.");
      conflict.code = "GITHUB_CONFLICT";
      conflict.status = 409;
      conflict.sha = current.sha;
      throw conflict;
    }

    const protectedCollections = [
      "inventoryItems",
      "orders",
      "clientSamples",
      "clients",
      "supplierContacts",
      "history",
      "stockMovements",
      "sourcingPatients"
    ];
    const catastrophicLosses = protectedCollections.flatMap(key => {
      const before = Array.isArray(current.data?.[key]) ? current.data[key].length : 0;
      const after = Array.isArray(data?.[key]) ? data[key].length : 0;
      const maximumExpectedDeletion = Math.max(5, Math.ceil(before * 0.2));
      return before - after > maximumExpectedDeletion ? [`${key}: ${before} → ${after}`] : [];
    });
    if (catastrophicLosses.length && !options.allowCatastrophic) {
      const unsafe = new Error(`Sauvegarde bloquée pour protéger les données (${catastrophicLosses.join(", ")}). Rechargez la page avant de réessayer.`);
      unsafe.code = "CATASTROPHIC_DATA_LOSS";
      unsafe.status = 422;
      throw unsafe;
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(config.path)}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        message: `Update ExAdEx shared inventory data ${new Date().toISOString()}`,
        content: encodeBase64Utf8(`${JSON.stringify(data, null, 2)}\n`),
        sha: current.sha || undefined,
        branch: config.branch
      })
    });

    if (response.status === 409) {
      const error = new Error("GitHub save conflict: local changes were preserved for recovery.");
      error.code = "GITHUB_CONFLICT";
      error.status = 409;
      error.sha = current.sha || null;
      throw error;
    }

    if (!response.ok) {
      throw new Error(`GitHub save failed: ${response.status}`);
    }

    const payload = await response.json();
    latestSha = payload.content?.sha || null;

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        sha: latestSha,
        loadedAt: new Date().toISOString()
      })
    );

    return latestSha;
}

  function backupSummary(data) {
    return {
      inventoryItems: Array.isArray(data?.inventoryItems) ? data.inventoryItems.length : 0,
      clientSamples: Array.isArray(data?.clientSamples) ? data.clientSamples.length : 0,
      locations: Array.isArray(data?.locationCatalog?.locations) ? data.locationCatalog.locations.length : 0,
      experiments: Array.isArray(data?.experiments) ? data.experiments.length : 0,
      sourcingPatients: Array.isArray(data?.sourcingPatients) ? data.sourcingPatients.length : 0,
      orders: Array.isArray(data?.orders) ? data.orders.length : 0,
      contacts: Array.isArray(data?.supplierContacts) ? data.supplierContacts.length : 0,
      history: Array.isArray(data?.history) ? data.history.length : 0
    };
  }

  async function requestRepositoryPath(config, path) {
    if (!configured(config)) {
      throw new Error("GitHub n'est pas configuré pour cette adresse Live Server.");
    }
    const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}&t=${Date.now()}`;
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (config.token) headers.Authorization = `Bearer ${config.token}`;
    const response = await fetch(url, { headers, cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub backup read failed: ${response.status}`);
    return response.json();
  }

  async function writeBackup(path, payload, message) {
    const config = getConfig();
    if (!configured(config) || !config.token) throw new Error("La sauvegarde GitHub en écriture est requise.");
    const existing = await requestRepositoryPath(config, path);
    if (existing) return { path, created: false };
    const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(path)}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${config.token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ message, content: encodeBase64Utf8(`${JSON.stringify(payload, null, 2)}\n`), branch: config.branch })
    });
    if (!response.ok && response.status !== 422) throw new Error(`GitHub backup write failed: ${response.status}`);
    localStorage.removeItem("exadex_backup_last_error");
    return { path, created: response.ok };
  }

  async function createNamedFullBackup(data, user, reason = "manual") {
    const now = new Date();
    const parts = Object.fromEntries(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
    const stamp = `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}`;
    const payload = { backupVersion: 1, type: "full", period: stamp, reason, createdAt: now.toISOString(), createdBy: user, summary: backupSummary(data), snapshot: data };
    const folder = reason === "pre-restore" ? "restore-points" : "manual";
    return writeBackup(`backups/${folder}/${stamp}.json`, payload, reason === "pre-restore" ? "Point de restauration automatique" : "Sauvegarde complète manuelle");
  }

  async function listBackups() {
    const config = getConfig();
    if (!configured(config)) return LOCAL_BACKUPS.map(entry => ({ ...entry }));
    const folders = [["inventory", "Copie hebdomadaire de l'inventaire"], ["full", "Copie complète mensuelle"], ["manual", "Copie complète manuelle"], ["restore-points", "Avant restauration"]];
    const groups = await Promise.all(folders.map(async ([folder, label]) => {
      const entries = await requestRepositoryPath(config, `backups/${folder}`);
      return (Array.isArray(entries) ? entries : []).filter(entry => entry.type === "file" && entry.name.endsWith(".json")).map(entry => ({ ...entry, folder, label }));
    }));
    return groups.flat().sort((a, b) => b.name.localeCompare(a.name));
  }

  async function loadBackup(path) {
    const config = getConfig();
    if (!configured(config)) {
      const response = await fetch(`${encodePath(path)}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Sauvegarde locale introuvable : ${response.status}`);
      return response.json();
    }
    const entry = await requestRepositoryPath(config, path);
    if (!entry?.content) throw new Error("Cette sauvegarde est introuvable.");
    return readJson(decodeBase64Utf8(String(entry.content).replace(/\s/g, "")), null);
  }

  async function deleteBackup(path) {
    const config = getConfig();
    if (!configured(config) || !config.token) throw new Error("La suppression nécessite la configuration GitHub en écriture.");
    const entry = await requestRepositoryPath(config, path);
    if (!entry?.sha) throw new Error("Cette sauvegarde est introuvable.");
    const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(path)}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${config.token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ message: `Supprimer la sauvegarde ${path}`, sha: entry.sha, branch: config.branch })
    });
    if (!response.ok) throw new Error(`GitHub backup delete failed: ${response.status}`);
    return true;
  }

  async function mutateSharedData(operationId, mutator, options = {}) {
    const maxAttempts = Math.max(1, Math.min(5, Number(options.maxAttempts || 3)));
    if (!operationId || typeof mutator !== "function") throw new Error("Invalid shared mutation.");
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const latest = await loadSharedData({ fresh: true });
      const data = latest.data || {};
      const movements = Array.isArray(data.stockMovements) ? data.stockMovements : [];
      const agentOperations = Array.isArray(data.agentOperations) ? data.agentOperations : [];
      const stockOperations = Array.isArray(data.stockOperations) ? data.stockOperations : [];
      const orders = Array.isArray(data.orders) ? data.orders : [];
      const orderReceipts = orders.flatMap(order => Array.isArray(order.inventoryReceiptOperations) ? order.inventoryReceiptOperations : []);
      if (movements.some(entry => entry.operationId === operationId) || agentOperations.some(entry => entry.operationId === operationId) || stockOperations.some(entry => entry.operationId === operationId) || orderReceipts.some(entry => entry.operationId === operationId)) {
        return { data, sha: latest.sha, duplicate: true };
      }
      const next = await mutator(JSON.parse(JSON.stringify(data)));
      try {
        const sha = await saveSharedData(next, latest.sha);
        return { data: next, sha, duplicate: false };
      } catch (error) {
        lastError = error;
        if (!/conflict|409/i.test(error.message || "") || attempt === maxAttempts) throw error;
      }
    }
    throw lastError || new Error("La mutation partagée a échoué.");
  }

  window.ExadexGithubStorage = {
    getConfig,
    loadSharedData,
    saveSharedData,
    mutateSharedData,
    createNamedFullBackup,
    listBackups,
    loadBackup,
    deleteBackup,
    backupSummary,
    STORAGE_CONFIG_KEY,
    TOKEN_KEY
  };
})();
