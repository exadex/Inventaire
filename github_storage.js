(function () {
  const STORAGE_CONFIG_KEY = "exadex_github_storage_config";
  const TOKEN_KEY = "exadex_github_token";

  const CACHE_KEY = "exadex_shared_state_cache";
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

  async function loadSharedData(options = {}) {
    const config = getConfig();

    if (!configured(config)) {
      return { data: null, sha: null, mode: "unconfigured" };
    }

    const result = await requestContents(config, options);

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: result.data,
        sha: result.sha,
        loadedAt: new Date().toISOString()
      })
    );

    return {
      ...result,
      mode: config.token ? "github-write" : "github-readonly"
    };
  }

  async function saveSharedData(data, previousSha) {
    const config = getConfig();

    if (!configured(config)) {
      throw new Error("GitHub storage is not configured.");
    }

    if (!config.token) {
      throw new Error("GitHub token is missing; shared data is read-only.");
    }

    const current = previousSha
      ? { sha: previousSha }
      : latestSha
        ? { sha: latestSha }
        : await requestContents(config, { fresh: true });

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
      throw new Error("GitHub save conflict: reload shared data and retry.");
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

  window.ExadexGithubStorage = {
    getConfig,
    loadSharedData,
    saveSharedData,
    STORAGE_CONFIG_KEY,
    TOKEN_KEY
  };
})();
